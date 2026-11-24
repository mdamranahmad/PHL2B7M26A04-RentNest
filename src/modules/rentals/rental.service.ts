import {
    PaymentStatus,
    BookingStatus,
    Role,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import httpStatus from "http-status";
import { IRentalRequest } from "./rentals.interface";
import { RentalRequestWhereInput } from "../../../generated/prisma/models";

// ================================================================
// A function to submit a rental requests for  property listings in the system
// ================================================================
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
            data: { isAvailable: "PENDING" },
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

const getRentalRequestsByUserId = async (
    userId: string,
    role: Role,
    query: IRentalRequest,
) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    let roleCondition: RentalRequestWhereInput = {};

    if (role === Role.LANDLORD) {
        roleCondition = { landLordId: userId };
    } else if (role === Role.TENANT) {
        roleCondition = { tenantId: userId };
    }

    const searchCondition: RentalRequestWhereInput[] = [];

    if (query.searchTerm && typeof query.searchTerm === "string") {
        const upperSearchTerm = query.searchTerm.toUpperCase();
        const isValidRentRequestEnum = Object.values(
            BookingStatus,
        ).includes(upperSearchTerm as BookingStatus);

        searchCondition.push(
            {
                landLord: {
                    name: { contains: query.searchTerm, mode: "insensitive" },
                },
            },
            {
                tenant: {
                    name: { contains: query.searchTerm, mode: "insensitive" },
                },
            },
            {
                property: {
                    title: { contains: query.searchTerm, mode: "insensitive" },
                },
            },
        );

        if (isValidRentRequestEnum) {
            searchCondition.push({
                rentRequestStatus: upperSearchTerm as BookingStatus,
            });
        }
    }

    const filterConditions: RentalRequestWhereInput[] = [];

    if (query.rentRequestStatus) {
        filterConditions.push({
            rentRequestStatus: (
                query.rentRequestStatus as string
            ).toUpperCase() as RentRequestStatus,
        });
    }

    const whereConditions: RentalRequestWhereInput = {
        AND: [
            roleCondition,
            ...filterConditions,
            ...(searchCondition.length > 0 ? [{ OR: searchCondition }] : []),
        ],
    };

    const total = await prisma.rentalRequest.count({
        where: whereConditions,
    });

    const result = await prisma.rentalRequest.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
            landLord: { select: { id: true, name: true, email: true } },
            tenant: { select: { id: true, name: true, email: true } },
            property: { select: { title: true, location: true, price: true } },
            payments: { select: { status: true } },
        },
    });

    return {
        metadata: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
        RentalRequests: result,
    };
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
