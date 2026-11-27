import { CategoryType } from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import httpStatus from "http-status";

// ================================================================
// A function to fetch all available categories from the database
// ================================================================
const getAllCategories = async () => {
    const allCategories = await prisma.category.findMany();

    return allCategories;
};

// ================================================================
// A function to add new category to the database
// ================================================================
const addCategory = async (categoryType: CategoryType) => {
    const createdCategory = await prisma.category.create({
        data: { categoryType },
    });

    return createdCategory;
};

// ================================================================
// A function to update existing category in the database
// ================================================================
const updateCategory = async (id: string, categoryType: CategoryType) => {
    const isCategoryTypeExists = await prisma.category.findUniqueOrThrow({
        where: { id },
    });

    if (isCategoryTypeExists.categoryType === categoryType) {
        throw new AppError(
            httpStatus.CONFLICT,
            `Category type for requested field is already setup as ${categoryType}`,
        );
    }

    const updatedCategoryType = await prisma.category.update({
        where: { id },
        data: { categoryType },
    });

    return updatedCategoryType;
};

// ================================================================
// A function to delete certain category from the database
// ================================================================
const deleteCategory = async (id: string) => {
    const isCategoryTypeExists = await prisma.category.findUniqueOrThrow({
        where: { id },
    });

    const deletedCategoryType = await prisma.category.delete({
        where: { id },
    });

    return null;
};

// const deleteCategory = async (req: Request, res: Response) => {};

export const categoriesService = {
    getAllCategories,
    addCategory,
    updateCategory,
    deleteCategory,
};
