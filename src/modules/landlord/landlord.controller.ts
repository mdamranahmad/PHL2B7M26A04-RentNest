import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { landlordService } from "./landlord.service";
import { AppError } from "../../middlewares/appError";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";

// ================================================================
// A function to get all property listings for user from the system
// ================================================================

const getAllPropertiesForUser = catchAsync(
    async (req: Request, res: Response) => {
        const landlordId = req.user?.id as string;

        const proeprties =
            await landlordService.getAllPropertiesForUser(landlordId);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Properties Fetched Successfully",
            data: proeprties,
        });
    },
);
// ================================================================
// A function to create property into the system
// ================================================================
const createProperties = catchAsync(async (req: Request, res: Response) => {
    const landlordId = req.user?.id as string;

    const payload = req.body;

    const property = await landlordService.createProperties(
        payload,
        landlordId,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Property Created Successfully",
        data: property,
    });
});

// ================================================================
// A function to update property listings into the system
// ================================================================
const updateProperties = catchAsync(async (req: Request, res: Response) => {
    const { id, role } = req.user!;

    const propertyId = req.params.id as string;

    const payload = req.body;

    const updatedProperty = await landlordService.updateProperties(
        payload,
        propertyId,
        id,
        role,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Property Updated Successfully",
        data: updatedProperty,
    });
});

// ================================================================
// A function to delete property listings into the system
// ================================================================
const deleteProperties = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.user!;

    const propertyId = req.params.id as string;

    await landlordService.deleteProperties(propertyId, id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Property Deleted Successfully",
        data: null,
    });
});
// ================================================================
//A function to show rental requests for all property listings for logged in user in the system
// ================================================================
const rentalRequestsForLandlord = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.user!;

        const rentalRequests =
            await landlordService.rentalRequestsForLandlord(id);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Rental request fetched successfully.",
            data: rentalRequests,
        });
    },
);

// ================================================================
// A function to handle rental requests for  property listings in the system
// ================================================================
const updateRentRequestStatus = catchAsync(
    async (req: Request, res: Response) => {
        const landLordId = req.user?.id!;

        const id = req.params?.id as string;

        const { rentRequestStatus } = req.body;

        const updatedRequestStatus =
            await landlordService.updateRentRequestStatus(
                id,
                rentRequestStatus,
                landLordId,
            );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Rental request updated successfully.",
            data: updatedRequestStatus,
        });
    },
);

export const landlordController = {
    createProperties,
    updateProperties,
    deleteProperties,
    rentalRequestsForLandlord,
    updateRentRequestStatus,
    getAllPropertiesForUser,
};
