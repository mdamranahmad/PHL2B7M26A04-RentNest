import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpstatus from "http-status";
import config from "../../config";
import { defaultCookieOptions } from "../../config/cookie";

// ================================================================
// A function to register user into the system
// ================================================================
const registerUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    // register and fetch registered userdata from database
    await authService.registerUser(payload);

    sendResponse(res, {
        success: true,
        statusCode: httpstatus.OK,
        message: "OTP sent to email for verification",
        data: null,
    });
});

// ================================================================
// A function to verify email for the newly registered user
// ================================================================
const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    const { accessToken, refreshToken } =
        await authService.verifyEmail(payload);

    // Storage of accessToken in browser cookies
    res.cookie("accessToken", accessToken, {
        ...defaultCookieOptions,
        maxAge: 24 * 60 * 60 * 1000,
    });

    // Storage of refreshToken in browser cookies
    res.cookie("refreshToken", refreshToken, {
        ...defaultCookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        success: true,
        statusCode: httpstatus.CREATED,
        message: "User Registration Successful.",
        data: { accessToken, refreshToken },
    });
});

// ================================================================
// A function to login user into the system using google oauth
// ================================================================
const googleLogin = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    // validation of credential and fetch data from database
    const { accessToken, refreshToken } =
        await authService.googleLogin(payload);

    // Storage of accessToken in browser cookies
    res.cookie("accessToken", accessToken, {
        ...defaultCookieOptions,
        maxAge: 24 * 60 * 60 * 1000,
    });

    // Storage of refreshToken in browser cookies
    res.cookie("refreshToken", refreshToken, {
        ...defaultCookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        success: true,
        statusCode: httpstatus.OK,
        message: "User Login Successful",
        data: { accessToken, refreshToken },
    });
});

// ================================================================
// A function to login user into the system
// ================================================================
const loginUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    // validation of credential and fetch data from database
    const { accessToken, refreshToken } = await authService.loginUser(payload);

    // Storage of accessToken in browser cookies
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
    });

    // Storage of refreshToken in browser cookies
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        success: true,
        statusCode: httpstatus.OK,
        message: "User Login Successfull",
        data: { accessToken, refreshToken },
    });
});
// ================================================================
// A function to login user with refresh token into the system
// ================================================================
const loginUserWithRefreshToken = catchAsync(
    async (req: Request, res: Response) => {
        const refrshToken = await req.cookies.refreshToken;
        // validation of credential and fetch data from database
        const { accessToken } =
            await authService.loginUserWithRefreshToken(refrshToken);

        // Storage of accessToken in browser cookies
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: config.node_env === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
        });

        sendResponse(res, {
            success: true,
            statusCode: httpstatus.OK,
            message: "User Login Successfull",
            data: { accessToken },
        });
    },
);

// ================================================================
// A function to fetch user profile from the database
// ================================================================
const getProfile = catchAsync(async (req: Request, res: Response) => {
    const profile = await authService.getProfile(req.user?.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpstatus.OK,
        message: "User Profile Fetched Successfully",
        data: profile,
    });
});

// const registerUser = catchAsync(async (async (req: Request, res: Response) => {});
// const registerUser = catchAsync(async (async (req: Request, res: Response) => {});

export const authController = {
    registerUser,
    verifyEmail,
    googleLogin,
    loginUser,
    getProfile,
    loginUserWithRefreshToken,
};
