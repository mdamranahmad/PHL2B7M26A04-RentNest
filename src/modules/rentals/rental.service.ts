// ================================================================
// A function to submit a rental requests for  property listings in the system
// ================================================================

import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import httpStatus from "http-status";

const submitRentalRequest = async (propertyId: string, tenantId: string) => {
    await prisma.user.findUniqueOrThrow({
        where: { id: tenantId },
    });

    return await prisma.$transaction(async (tx) => {
        const property = await tx.property.findUnique({
            where: { id: propertyId },
        });

        if (!property) {
            throw new AppError(
                httpStatus.NOT_FOUND,
                "The requested proeprty list does not exists.",
            );
        }

        if (property.isAvailable !== "Available") {
            throw new AppError(
                httpStatus.CONFLICT,
                "The property is already rented or has pending applications.",
            );
        }

        await tx.property.update({
            where: { id: propertyId },
            data: { isAvailable: "UNAVAILABLE" },
        });
        return await tx.rentalRequest.create({
            data: {
                propertyId,
                rentRequestStatus: "PENDING",
                tenantId,
                landLordId: property.landLordId,
            },
        });
    });
};
// ================================================================
// A function to get all rental requests for a tenant in the system
// ================================================================

const getRentalRequestsByUserId = async (userId: string, role: Role) => {
    if (role === Role.ADMIN) {
        return await prisma.rentalRequest.findMany();
    }

    if (role === Role.LANDLORD) {
        return await prisma.rentalRequest.findMany({
            where: { landLordId: userId },
        });
    }

    return await prisma.rentalRequest.findMany({ where: { tenantId: userId } });
};
// ================================================================
// A function to get details of a rental request by rental request id in the system
// ================================================================

const getRentalRequestDetails = async (
    id: string,
    requesterId: string,
    role: Role,
) => {
    const rentalRequest = await prisma.rentalRequest.findUniqueOrThrow({
        where: { id },
    });

    const isAuthorized =
        role === Role.ADMIN ||
        rentalRequest.tenantId === requesterId ||
        rentalRequest.landLordId === requesterId;

    if (!isAuthorized) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You do not have permission to view this rental record.",
        );
    }

    return rentalRequest;
};

// ================================================================
// A function to delete a rental request by rental request id from the system
// ================================================================

const deleteRentalRequestById = async (id: string, tenantId: string) => {
    const isTheTenant = await prisma.rentalRequest.findUniqueOrThrow({
        where: { id },
    });

    if (isTheTenant.tenantId !== tenantId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You can only cancel or delete your own rental requests.",
        );
    }

    return await prisma.$transaction(async (tx) => {
        await tx.property.update({
            where: { id: isTheTenant.propertyId },
            data: { isAvailable: "Available" },
        });

        await tx.rentalRequest.delete({ where: { id } });

        return null;
    });
};

export const rentalRequestServices = {
    submitRentalRequest,
    getRentalRequestsByUserId,
    getRentalRequestDetails,
    deleteRentalRequestById,
};
