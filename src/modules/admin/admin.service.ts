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
    });
};

// ================================================================
// A function to update userStatus for specific user in the system
// ================================================================
const updateUserStatus = async (payload: IUpdateStatus, userId: string) => {
    const { status } = payload;

    // Check User Exists in the database
    await prisma.user.findUniqueOrThrow({
        where: { id: userId },
    });

    return await prisma.user.update({
        where: { id: userId },
        data: { status },
    });
};

// ================================================================
// A function to get all properties from the system
// ================================================================
const getAllProperties = async () => {
    return await prisma.property.findMany();
};

// ================================================================
// A function to get all rental requests from the system
// ================================================================
const getAllRentalRequests = async () => {
    return await prisma.rentalRequest.findMany();
};

export const adminService = {
    getAllUsers,
    updateUserStatus,
    getAllProperties,
    getAllRentalRequests,
};
