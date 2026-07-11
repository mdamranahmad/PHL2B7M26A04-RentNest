import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";

const createProperties = catchAsync(async (req: Request, res: Response) => {});

// const createProperties = catchAsync(async (req: Request, res: Response) => {});
// const createProperties = catchAsync(async (req: Request, res: Response) => {});

export const propertiesController = {
    createProperties,
};
