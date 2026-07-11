import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpstatus from "http-status";
import config from "../../config";

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    // register and fetch registered userdata from database
    const user = await authService.registerUser(payload);

    sendResponse(res, {
        success: true,
        statusCode: httpstatus.CREATED,
        message: "User Registered Successfully.",
        data: user,
    });
});

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
    loginUser,
    getProfile,
};
