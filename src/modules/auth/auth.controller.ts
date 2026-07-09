import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpstatus from "http-status";

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

// const loginUser = catchAsync(async (req: Request, res: Response) => {
//     const payload = req.body;

//     // validation of credential and fetch data from database
//     const user = await authService.loginUser(payload);

//     sendResponse(res, {
//         success: true,
//         statusCode: httpstatus.OK,
//         message: "User Login Successfull",
//         data: user,
//     });
// });

// const registerUser = catchAsync(async () => {});
// const registerUser = catchAsync(async () => {});

export const authController = {
    registerUser,
    // loginUser,
};
