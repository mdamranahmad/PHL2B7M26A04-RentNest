import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { categoriesService } from "./categories.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { AppError } from "../../middlewares/appError";

// ================================================================
// A function to get all categories from the database
// ================================================================
const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const allCategories = await categoriesService.getAllCategories();
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All Category Types Retrieved Successfully",
        data: allCategories,
    });
});

// ================================================================
// A function to add new category to the database
// ================================================================
const addCategory = catchAsync(async (req: Request, res: Response) => {
    const { categoryType } = req.body;

    const createdCategory = await categoriesService.addCategory(categoryType);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Category Type Added Successfully",
        data: createdCategory,
    });
});

// ================================================================
// A function to update existing category in the database
// ================================================================
const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const categoryTypeId = req.params.categoryTypeId as string;

    // if (!categoryTypeId) {
    //     throw new AppError(
    //         httpStatus.BAD_REQUEST,
    //         "The required URL query parameter was not provided",
    //     );
    // }

    const { categoryType } = req.body;

    const updatedCategoryType = await categoriesService.updateCategory(
        categoryTypeId,
        categoryType,
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Category Type Updated Successfully.",
        data: updatedCategoryType,
    });
});

// ================================================================
// A function to delete certain category from the database
// ================================================================
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const categoryTypeId = req.params.categoryTypeId as string;

    await categoriesService.deleteCategory(categoryTypeId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Category Type Deleted Successfully.",
        data: null,
    });
});
export const categoriesController = {
    getAllCategories,
    addCategory,
    updateCategory,
    deleteCategory,
};
