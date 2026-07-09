import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpstatus from "http-status";

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    const user = await authService.registerUser(payload);

    sendResponse(res, {
        success: true,
        statusCode: httpstatus.CREATED,
        message: "User Registered Successfully.",
        data: user,
    });
});

// const registerUser = catchAsync(async () => {});
// const registerUser = catchAsync(async () => {});

export const authController = {
    registerUser,
};
