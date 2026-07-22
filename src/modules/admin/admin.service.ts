import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import { IUpdateStatus } from "./admin.interface";
import httpStatus from "http-status";

// ================================================================
// A function to get all users profile from the system
// ================================================================
const getAllUsers = async () => {
    return await prisma.user.findMany({
        omit: { passwordHash: true },
        include: {
            properties: {
                select: { title: true, description: true, location: true },
            },
        },
    });
};

// ================================================================
// A function to update userStatus for specific user in the system
// ================================================================
const updateUserStatus = async (payload: IUpdateStatus, userId: string) => {
    const { status } = payload;

    return await prisma.user.update({
        where: { id: userId },
        data: { status },
    });
};

// ================================================================
// A function to get all properties from the system
// ================================================================
const getAllProperties = async () => {
    return await prisma.property.findMany({
        include: {
            category: { select: { categoryType: true } },
            landLord: { select: { name: true } },
            rentalRequests: {
                select: {
                    rentRequestStatus: true,
                    tenant: { select: { name: true } },
                },
            },
            reviews: { select: { id: true, rating: true, comment: true } },
        },
    });
};

// ================================================================
// A function to get all rental requests from the system
// ================================================================
const getAllRentalRequests = async () => {
    return await prisma.rentalRequest.findMany({
        include: {
            property: {
                select: { title: true, description: true, location: true },
            },
            landLord: { select: { name: true, profilePhoto: true } },
            tenant: { select: { name: true, profilePhoto: true } },
        },
    });
};

export const adminService = {
    getAllUsers,
    updateUserStatus,
    getAllProperties,
    getAllRentalRequests,
};
