import config from "../../config";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import { ILoginUser, IUser } from "./auth.interface";
import bcrypt from "bcrypt";
import httpStatus from "http-status";
import { jwtUtils } from "../../utils/jwt";
import { SignOptions } from "jsonwebtoken";

// ================================================================
// A function to register user into the system
// ================================================================
const registerUser = async (payload: IUser) => {
    // Striping password and relations which are unavailale during registration from payload
    const {
        password,
        tenantRequests,
        landLordRequests,
        properties,
        reviews,
        ...userPayload
    } = payload;

    // Checks if the user already exists in the system
    const isUserExists = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (isUserExists) {
        throw new AppError(httpStatus.CONFLICT, "User Already Exists.");
    }

    // Create password hash for security concern
    const passwordHash = await bcrypt.hash(
        password,
        Number(config.bcrypt_salt_rounds),
    );

    // Register user into the system
    const registeredUser = await prisma.user.create({
        data: { ...userPayload, passwordHash },
    });

    // Fetch Registered user from database
    const user = await prisma.user.findUnique({
        where: { id: registeredUser.id },
        omit: { passwordHash: true },
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
    loginUser,
    getProfile,
};
