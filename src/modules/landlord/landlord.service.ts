import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import { IProperties, IUpdateProperties } from "./landlord.interface";
import httpStatus from "http-status";

// ================================================================
// A function to create property into the system
// ================================================================
const createProperties = async (payload: IProperties, landLordId: string) => {
    // Payload Destructure
    const {
        title,
        description,
        location,
        price,
        amenities,
        category,
        isAvailable,
    } = payload;

    // Check if user exists
    await prisma.user.findUniqueOrThrow({
        where: { id: landLordId },
    });

    // Find category for new property
    const findCategory = await prisma.category.findUniqueOrThrow({
        where: { categoryType: category },
    });

    // Create new properties in database
    return await prisma.property.create({
        data: {
            title,
            description,
            location,
            price,
            amenities,
            categoryId: findCategory.id,
            isAvailable,
            landLordId,
        },
    });
};

// ================================================================
// A function to update property listings into the system
// ================================================================
const updateProperties = async (
    payload: IUpdateProperties,
    id: string,
    landLordId: string,
    role: Role,
) => {
    // check if property exists
    const isPropertyExists = await prisma.property.findUniqueOrThrow({
        where: { id },
    });

    if (isPropertyExists.landLordId === landLordId || role === "ADMIN") {
        return await prisma.property.update({
            where: { id },
            data: { ...payload },
        });
    }

    throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You do not have permission to modify this property.",
    );
};

// ================================================================
// A function to delete property listings into the system
// ================================================================
const deleteProperties = async (id: string, landLordId: string, role: Role) => {
    // check if property exists
    const isPropertyExists = await prisma.property.findUniqueOrThrow({
        where: { id },
    });

    // Check if user is the owner or admin
    if (isPropertyExists.landLordId === landLordId || role === "ADMIN") {
        await prisma.property.delete({
            where: { id },
        });

        return null;
    }

    throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You do not have permission to delete this property.",
    );
};
// ================================================================
// A function to show rental requests for specific property listings in the system
// ================================================================
const rentalRequestForProperties = async (req: Request, res: Response) => {};

// ================================================================
// A function to handle rental requests for  property listings in the system
// ================================================================
const rentalRequestApprovalForProperties = async (
    req: Request,
    res: Response,
) => {};

export const landlordService = {
    createProperties,
    updateProperties,
    deleteProperties,
    rentalRequestForProperties,
    rentalRequestApprovalForProperties,
};
