// ================================================================
// A function to submit a rental requests for  property listings in the system
// ================================================================

import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AppError } from "../../middlewares/appError";
import httpstatus from "http-status";
import { rentalRequestServices } from "./rental.service";
import { sendResponse } from "../../utils/sendResponse";

const submitRentalRequest = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new AppError(
            httpstatus.UNAUTHORIZED,
            "Authentication Required! Please Login to Submit A Rental Request",
        );
    }
    const { propertyId } = req.body;

    const tenantId = req.user?.id as string;

    const rentalRequest = await rentalRequestServices.submitRentalRequest(
        propertyId,
        tenantId,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpstatus.CREATED,
        message: "Rental Request Submitted Successfully",
        data: rentalRequest,
    });
});
// ================================================================
// A function to get all rental requests for a tenant in the system
// ================================================================

const getRentalRequestsByUserId = catchAsync(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new AppError(
                httpstatus.UNAUTHORIZED,
                "Authentication Required! Please Login to Submit A Rental Request",
            );
        }

        const { id, role } = req.user;

        const rentalRequestsForUser =
            await rentalRequestServices.getRentalRequestsByUserId(id, role);

        sendResponse(res, {
            success: true,
            statusCode: httpstatus.OK,
            message: "Rental Requests Fetched Successfully",
            data: rentalRequestsForUser,
        });
    },
);
// ================================================================
// A function to get details of a rental request by rental request id in the system
// ================================================================

const getRentalRequestDetails = catchAsync(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new AppError(
                httpstatus.UNAUTHORIZED,
                "Authentication Required! Please Login to Submit A Rental Request",
            );
        }

        const { id, role } = req.user;

        const rentalRequestid = req.params?.id as string;

        const rentalRequestsDetails =
            await rentalRequestServices.getRentalRequestDetails(
                rentalRequestid,
                id,
                role,
            );

        sendResponse(res, {
            success: true,
            statusCode: httpstatus.OK,
            message: "Details of Rental Request Fetched Successfully",
            data: rentalRequestsDetails,
        });
    },
);

// ================================================================
// A function to delete a rental request by rental request id from the system
// ================================================================

const deleteRentalRequestById = catchAsync(
    async (req: Request, res: Response) => {
        if (!req.user) {
            throw new AppError(
                httpstatus.UNAUTHORIZED,
                "Authentication Required! Please Login to Submit A Rental Request",
            );
        }

        const tenantId = req.user?.id as string;

        const rentalRequestid = req.params?.id as string;

        await rentalRequestServices.deleteRentalRequestById(
            rentalRequestid,
            tenantId,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpstatus.OK,
            message: "Rental Request Deleted Successfully",
            data: null,
        });
    },
);

export const rentalrequestController = {
    submitRentalRequest,
    getRentalRequestsByUserId,
    getRentalRequestDetails,
    deleteRentalRequestById,
};
