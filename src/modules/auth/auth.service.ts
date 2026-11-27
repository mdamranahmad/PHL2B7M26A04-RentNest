import config from "../../config";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import {
    ILoginUser,
    IRedisRegisterPayload,
    IUserRegisterPayload,
    IVerifyEmail,
} from "./auth.interface";
import bcrypt from "bcrypt";
import httpStatus from "http-status";
import { jwtUtils } from "../../utils/jwt";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import path from "path";
import ejs from "ejs";
import { Role } from "../../../generated/prisma/enums";

// ================================================================
// A function to register user into the system
// ================================================================
const registerUser = async (payload: IUserRegisterPayload) => {
    // Striping password and relations which are unavailale during registration from payload
    const { name, email, password } = payload;

    // Checks if the user already exists in the system
    const isUserExists = await prisma.user.findUnique({
        where: { email: payload.email },
        select: { id: true, email: true },
    });

    if (isUserExists) {
        throw new AppError(httpStatus.CONFLICT, "User Already Exists.");
    }

    // Create password hash for security concern
    const passwordHash = await bcrypt.hash(
        password,
        Number(config.bcrypt_salt_rounds),
    );

    // // Register user into the system
    // const registeredUser = await prisma.user.create({
    //     data: { ...userPayload, passwordHash },
    // });

    // Cache user data in redis for email verification
    const redisPayloadKey = `registration-payload: ${email}`;
    const otpValue = crypto.randomInt(100000, 1000000);
    const redisPayload = { name, email, passwordHash, otpValue };

    if (config.node_env === "development") {
        console.log(`${redisPayload.email}: ${otpValue}`);
    }

    await redisClient.set(redisPayloadKey, JSON.stringify(redisPayload), {
        expiration: {
            type: "EX",
            value: 60 * 5,
        },
    });

    const templatePath = path.join(
        process.cwd(),
        "src/templates/verify-email.ejs",
    );

    const html = await ejs.renderFile(templatePath, {
        appName: "RentNest",
        name,
        otpValue,
        expiresIn: "5 Minutes",
        supportEmail: "support@rentnest.com",
    });

    await transporter.sendMail({
        from: config.email_sender,
        to: email,
        subject: "Verify Your Email Address",
        html,
    });

    return null;
};

// ================================================================
// A function to verify email for newly registered user
// ================================================================
const verifyEmail = async (payload: IVerifyEmail) => {
    const { email, otp } = payload;

    // Checks if the user already exists in the system
    const isUserExists = await prisma.user.findUnique({
        where: { email: payload.email },
        select: { id: true, email: true },
    });

    if (isUserExists) {
        throw new AppError(httpStatus.CONFLICT, "User Already Exists.");
    }

    // Check user data in redis for email verification
    const redisPayloadKey = `registration-payload: ${email}`;

    const redisPayloadJson = await redisClient.get(redisPayloadKey);

    if (!redisPayloadJson) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Something went wrong! Please register again",
        );
    }

    const redisPayload: IRedisRegisterPayload = JSON.parse(redisPayloadJson);

    if (redisPayload.otpValue !== otp) {
        throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match!");
    }

    const user = await prisma.user.create({
        data: {
            name: redisPayload.name,
            email: redisPayload.email,
            passwordHash: redisPayload.passwordHash,
            role: Role.TENANT,
            emailVerified: true,
        },
        select: { id: true, name: true, email: true, role: true },
    });

    await redisClient.del(redisPayloadKey);

    const templatePath = path.join(
        process.cwd(),
        "src/templates/welcome-email.ejs",
    );

    const html = await ejs.renderFile(templatePath, {
        appName: "RentNest",
        name: user.name,
        supportEmail: "support@rentnest.com",
    });

    await transporter.sendMail({
        from: config.email_sender,
        to: user.email,
        subject: "Welcome to RentNest",
        html,
    });

    return user;
};

// ================================================================
// A function to login user into the system
// ================================================================
const loginUser = async (payload: ILoginUser) => {
    const { email, password } = payload;

    // Check if the user exists
    const user = await prisma.user.findUniqueOrThrow({
        where: { email },
    });

    // Check if the User have proper credentials
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordMatch) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Invaild Credentials");
    }

    // Check if the user has proper access
    if (user.status === "BANNED") {
        throw new AppError(httpStatus.FORBIDDEN, "User Account Suspended");
    }

    const tokenPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    // Generation of Access Token
    const accessToken = jwtUtils.createToken(
        tokenPayload,
        config.jwt_secret_key,
        config.jwt_secret_key_expires_in as SignOptions,
    );

    // Generation of Refresh Token
    const refreshToken = jwtUtils.createToken(
        tokenPayload,
        config.jwt_refresh_secret_key,
        config.jwt_refresh_secret_key_expires_in as SignOptions,
    );

    return { accessToken, refreshToken };
};
// ================================================================
// A function to login user with refreshToken into the system
// ================================================================
const loginUserWithRefreshToken = async (token: string) => {
    const verifiedRefreshToken = jwtUtils.tokenVerification(
        token,
        config.jwt_refresh_secret_key,
    );

    if (!verifiedRefreshToken) {
        throw new AppError(httpStatus.NOT_FOUND, "Invalid Refresh Token!");
    }

    const { id, name, email, role } = verifiedRefreshToken as JwtPayload;

    const user = await prisma.user.findUnique({
        where: {
            id,
            name,
            email,
            role,
        },
        select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exists");
    }

    // Check if the user has proper access
    if (user.status === "BANNED") {
        throw new AppError(httpStatus.FORBIDDEN, "User Account Suspended");
    }

    const tokenPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    // Generation of Access Token
    const accessToken = jwtUtils.createToken(
        tokenPayload,
        config.jwt_secret_key,
        config.jwt_secret_key_expires_in as SignOptions,
    );

    return { accessToken };
};

// ================================================================
// A function to fetch user profile from the database
// ================================================================
const getProfile = async (userId: string) => {
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            id: userId,
        },
        omit: {
            passwordHash: true,
        },
        include: {
            properties: true,
            landLordRequests: true,
            tenantRequests: true,
            reviews: true,
        },
    });
    return user;
};

export const authService = {
    registerUser,
    verifyEmail,
    loginUser,
    getProfile,
    loginUserWithRefreshToken,
};
