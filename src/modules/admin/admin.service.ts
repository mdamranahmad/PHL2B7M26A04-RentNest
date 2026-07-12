import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import { IUpdateStatus } from "./admin.interface";
import httpStatus from "http-status";

// ================================================================
// A function to get all users profile from the system
// ================================================================
const getAllUsers = async () => {
    const allUsers = await prisma.user.findMany();

    return allUsers;
};

// ================================================================
// A function to update userStatus for specific user in the system
// ================================================================
const updateUserStatus = async (payload: IUpdateStatus, userId: string) => {
    const { status } = payload;

    // Check User Exists in the database
    const isUserExists = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
    });

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status },
    });

    if (!updatedUser) {
        throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Something Went Wrong.",
        );
    }

    return updatedUser;
};

// ================================================================
// A function to get all properties from the system
// ================================================================
const getAllProperties = async () => {
    const allProperties = await prisma.property.findMany();

    return allProperties;
};

// ================================================================
// A function to get all rental requests from the system
// ================================================================
const getAllRentalRequests = async () => {
    const allRentalRequests = await prisma.rentalRequest.findMany();

    return allRentalRequests;
};

export const adminService = {
    getAllUsers,
    updateUserStatus,
    getAllProperties,
    getAllRentalRequests,
};
