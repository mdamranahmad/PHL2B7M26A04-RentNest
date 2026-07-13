import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { propertyService } from "./properties.service";

const getPropertyDetails = catchAsync(async (req: Request, res: Response) => {
    const id = req.params?.id as string;

    const propertyDetails = await propertyService.getPropertyDetails(id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Property Details Fetched Successfully.",
        data: propertyDetails,
    });
});

export const propertyController = { getPropertyDetails };
