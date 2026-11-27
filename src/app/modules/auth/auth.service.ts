import config from "../../config";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import {
    IGoogleLoginPayload,
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
import {
    AuthProvider,
    Role,
    UserStatus,
} from "../../../../generated/prisma/enums";
import { googleClient } from "../../lib/googleAuth";
import { TokenPayload } from "google-auth-library";
import { accessRefreshTokenGenerate } from "../../utils/accessRefreshTokenGenerate";

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
    const otpValue = crypto.randomInt(100000, 1000000).toString();
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
        "src/app/templates/verify-email.ejs",
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
            tenant: {
                create: {
                    name: redisPayload.name,
                    email: redisPayload.email,
                },
            },
        },
        select: { id: true, name: true, email: true, role: true },
    });

    await redisClient.del(redisPayloadKey);

    const templatePath = path.join(
        process.cwd(),
        "src/app/templates/welcome-email.ejs",
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

    const tokenPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    const { accessToken, refreshToken } =
        accessRefreshTokenGenerate(tokenPayload);

    return { accessToken, refreshToken };
};

// ================================================================
// A function to login user into the system using google oauth
// ================================================================
const googleLogin = async (payload: IGoogleLoginPayload) => {
    // Get User Payload from Google
    let googleIdTokenPayload: TokenPayload | null | undefined = null;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: payload.googleIdToken,
            audience: config.google_client_id,
        });

        googleIdTokenPayload = ticket.getPayload();
    } catch (error) {
        console.log("Google IdToken Verification Failed! ", error);
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Invalid or Expired Google IdToken!",
        );
    }

    // Check The Errors from Google Login
    if (!googleIdTokenPayload) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Invalid or Expired Google IdToken!",
        );
    }

    if (!googleIdTokenPayload.email) {
        throw new AppError(httpStatus.BAD_REQUEST, "Google Email Not Found!");
    }

    if (!googleIdTokenPayload.name) {
        throw new AppError(httpStatus.BAD_REQUEST, "Google Name Not Found!");
    }

    // Check if the user exists
    const isUserExistsWithGoogleAuth = await prisma.user.findUnique({
        where: {
            email: googleIdTokenPayload.email,
            role: Role.TENANT,
            googleId: googleIdTokenPayload.sub,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            status: true,
            isDeleted: true,
        },
    });

    let user = isUserExistsWithGoogleAuth;

    if (!isUserExistsWithGoogleAuth) {
        const isUserExistsWithCredentials = await prisma.user.findUnique({
            where: {
                email: googleIdTokenPayload.email,
                role: Role.TENANT,
                authProvider: AuthProvider.CREDENTIAL,
            },
        });

        if (isUserExistsWithCredentials) {
            if (!isUserExistsWithCredentials?.emailVerified) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "Email not verified!",
                );
            }

            if (isUserExistsWithCredentials?.status === UserStatus.BANNED) {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    "User has limited access!",
                );
            }

            if (isUserExistsWithCredentials?.isDeleted) {
                throw new AppError(httpStatus.BAD_REQUEST, "User is deleted!");
            }

            user = await prisma.user.update({
                where: {
                    id: isUserExistsWithCredentials.id,
                },
                data: {
                    googleId: googleIdTokenPayload.sub,
                },
            });
        } else {
            user = await prisma.user.create({
                data: {
                    name: googleIdTokenPayload.name,
                    email: googleIdTokenPayload.email,
                    role: Role.TENANT,
                    googleId: googleIdTokenPayload.sub,
                    authProvider: AuthProvider.GOOGLE,
                    profilePhoto: googleIdTokenPayload.picture,
                    emailVerified: true,
                    tenant: {
                        create: {
                            name: googleIdTokenPayload.name,
                            email: googleIdTokenPayload.email,
                        },
                    },
                },
            });
        }
    }

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, "User not found!");
    }

    if (!user?.emailVerified) {
        throw new AppError(httpStatus.BAD_REQUEST, "Email not verified!");
    }

    if (user?.status === UserStatus.BANNED) {
        throw new AppError(httpStatus.BAD_REQUEST, "User has limited access!");
    }

    if (user?.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is deleted!");
    }

    const tokenPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    const { accessToken, refreshToken } =
        accessRefreshTokenGenerate(tokenPayload);

    return { accessToken, refreshToken };
};

// ================================================================
// A function to login user into the system
// ================================================================
const loginUser = async (payload: ILoginUser) => {
    const { email, password } = payload;

    // Check if the user exists
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            isDeleted: true,
            status: true,
        },
    });

    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, "user does not exists!");
    }

    if (!user.passwordHash) {
        throw new AppError(httpStatus.BAD_REQUEST, "user does not exists!");
    }

    // Check if the User have proper credentials
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordMatch) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Invaild Credentials");
    }

    // Check if the user has proper access
    if (user.status === "BANNED") {
        throw new AppError(httpStatus.FORBIDDEN, "User Account Suspended");
    }

    if (user.isDeleted) {
        throw new AppError(httpStatus.FORBIDDEN, "User Account Terminated");
    }

    const tokenPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    const { accessToken, refreshToken } =
        accessRefreshTokenGenerate(tokenPayload);

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
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            isDeleted: true,
        },
    });
    if (!user) {
        throw new AppError(httpStatus.BAD_REQUEST, "user does not exists!");
    }

    // Check if the user has proper access
    if (user.status === "BANNED") {
        throw new AppError(httpStatus.FORBIDDEN, "User Account Suspended");
    }

    if (user.isDeleted) {
        throw new AppError(httpStatus.FORBIDDEN, "User Account Terminated");
    }

    const tokenPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    // Generation of Access Token
    const { accessToken } = accessRefreshTokenGenerate(tokenPayload);

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
            landLord: true,
            tenant: true,
        },
    });
    return user;
};

export const authService = {
    registerUser,
    verifyEmail,
    googleLogin,
    loginUser,
    getProfile,
    loginUserWithRefreshToken,
};
