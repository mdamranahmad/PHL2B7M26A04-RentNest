import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { landlordService } from "./landlord.service";
import { AppError } from "../../middlewares/appError";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";

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

    if (!property) {
        throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Something Went Wrong. Please Try Again.",
        );
    }

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
    const landlordId = req.user?.id as string;

    const propertyId = req.params.id as string;

    const payload = req.body;

    const updatedProperty = await landlordService.updateProperties(
        payload,
        propertyId,
        landlordId,
    );

    if (!updatedProperty) {
        throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Something Went Wrong. Please Try Again.",
        );
    }

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
const deleteProperties = catchAsync(async (req: Request, res: Response) => {});

// ================================================================
// A function to show rental requests for specific property listings in the system
// ================================================================
const rentalRequestForProperties = catchAsync(
    async (req: Request, res: Response) => {},
);

// ================================================================
// A function to handle rental requests for  property listings in the system
// ================================================================
const rentalRequestApprovalForProperties = catchAsync(
    async (req: Request, res: Response) => {},
);

export const landlordController = {
    createProperties,
    updateProperties,
    deleteProperties,
    rentalRequestForProperties,
    rentalRequestApprovalForProperties,
};
