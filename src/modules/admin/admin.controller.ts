import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { adminService } from "./admin.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { AppError } from "../../middlewares/appError";

// ================================================================
// A function to get all user profiles from the system
// ================================================================
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const allUsers = await adminService.getAllUsers();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Profile Fetched Successfully.",
        data: allUsers,
    });
});

// ================================================================
// A function to update userStatus for specific user in the system
// ================================================================
const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id as string;

    const payload = req.body;

    if (!payload.status) {
        throw new AppError(httpStatus.BAD_REQUEST, "Status Value Required!");
    }

    const updatedUser = await adminService.updateUserStatus(payload, userId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Status Updated Successfully.",
        data: updatedUser,
    });
});

// ================================================================
// A function to get all properties from the system
// ================================================================
const getAllProperties = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    const allProperties = await adminService.getAllProperties(query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Listed Properties Fetched Successfully.",
        data: allProperties,
    });
});

// ================================================================
// A function to get all rental requests from the system
// ================================================================
const getAllRentalRequests = catchAsync(async (req: Request, res: Response) => {
    const allRentalRequests = await adminService.getAllRentalRequests();

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Rental Requests Fetched Successfully.",
        data: allRentalRequests,
    });
});

export const adminController = {
    getAllUsers,
    updateUserStatus,
    getAllProperties,
    getAllRentalRequests,
};
