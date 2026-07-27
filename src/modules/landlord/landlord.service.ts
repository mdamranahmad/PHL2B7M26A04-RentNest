import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import { IProperties, IUpdateProperties } from "./landlord.interface";
import httpStatus from "http-status";

// ================================================================
// A function to fetch all proeprties for the user from the system
// ================================================================
const getAllPropertiesForUser = async (landLordId: string) => {
    return await prisma.property.findMany({
        where: {
            landLordId,
        },
    });
};

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
const deleteProperties = async (id: string, landLordId: string) => {
    return await prisma.$transaction(async (tx) => {
        const property = await tx.property.findFirst({
            where: {
                id,
                landLordId,
            },
        });

        if (!property) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                "Property not found or unauthorized access!",
            );
        }

        if (property.isAvailable === "RENTED") {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Can not delete a rented property!",
            );
        }

        await tx.rentalRequest.updateMany({
            where: {
                propertyId: id,
                rentRequestStatus: "PENDING",
            },
            data: { rentRequestStatus: "REJECTED" },
        });

        await tx.property.updateMany({
            where: { id },
            data: { isAvailable: "UNAVAILABLE" },
        });
    });
};
// ================================================================
// A function to show rental requests for all property listings for logged in user in the system
// ================================================================
const rentalRequestsForLandlord = async (landLordId: string) => {
    return await prisma.rentalRequest.findMany({
        where: {
            landLordId,
        },
        include: {
            landLord: { select: { name: true } },
            tenant: { select: { name: true } },
            property: { select: { title: true, isAvailable: true } },
        },
    });
};

// ================================================================
// A function to handle rental requests for  property listings in the system
// ================================================================
const updateRentRequestStatus = async (
    id: string,
    requestStatus: string,
    landLordId: string,
) => {
    return await prisma.$transaction(async (tx) => {
        const rentRequest = await tx.rentalRequest.findFirst({
            where: {
                id,
                landLordId,
                rentRequestStatus: "PENDING",
            },
        });

        const isPropertyAvailable = await tx.property.findFirst({
            where: {
                id: rentRequest?.propertyId,
                isAvailable: "Available",
            },
        });

        if (!rentRequest || !isPropertyAvailable) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                "Rent request not found or unauthorized access!",
            );
        }

        if (requestStatus == "REJECTED") {
            await tx.property.update({
                where: {
                    id: rentRequest.propertyId,
                },
                data: { isAvailable: "Available" },
            });

            return await tx.rentalRequest.update({
                where: {
                    id,
                },
                data: {
                    rentRequestStatus: "REJECTED",
                },
            });
        }
        if (requestStatus == "APPROVED") {
            await tx.property.update({
                where: {
                    id: rentRequest.propertyId,
                },
                data: { isAvailable: "RENTED" },
            });
            return await tx.rentalRequest.update({
                where: {
                    id,
                },
                data: {
                    rentRequestStatus: "APPROVED",
                },
            });
        }
    });
};

export const landlordService = {
    createProperties,
    updateProperties,
    deleteProperties,
    rentalRequestsForLandlord,
    updateRentRequestStatus,
    getAllPropertiesForUser,
};
