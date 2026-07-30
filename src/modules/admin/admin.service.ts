import { equal } from "node:assert";
import {
    AvailabilityStatus,
    CategoryType,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import { IPropertyQuery, IUpdateStatus } from "./admin.interface";
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
const getAllProperties = async (query: IPropertyQuery) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortBy : "desc";

    const skipt = (page - 1) * limit;
    const searchUpper = query.searchTerm ? query.searchTerm.toUpperCase() : "";
    const isCategoryEnum = Object.values(CategoryType).includes(
        searchUpper as CategoryType,
    );
    return await prisma.property.findMany({
        // Implement Query
        where: {
            AND: [
                query.searchTerm
                    ? {
                          OR: [
                              {
                                  title: {
                                      contains: query.searchTerm,
                                      mode: "insensitive",
                                  },
                              },
                              {
                                  description: {
                                      contains: query.searchTerm,
                                      mode: "insensitive",
                                  },
                              },
                              {
                                  location: {
                                      contains: query.searchTerm,
                                      mode: "insensitive",
                                  },
                              },
                              ...(isCategoryEnum
                                  ? [
                                        {
                                            category: {
                                                categoryType: {
                                                    equals: searchUpper as CategoryType,
                                                },
                                            },
                                        },
                                    ]
                                  : []),
                          ],
                      }
                    : {},
                // Title Filtering
                query.title
                    ? {
                          title: {
                              contains: query.title as string,
                              mode: "insensitive",
                          },
                      }
                    : {},

                // Description filtering
                query.description ? { description: query.description } : {},

                // Amenities Filtering
                query.amenities
                    ? {
                          amenities: {
                              has: query.amenities as string,
                              mode: "insensitive",
                          },
                      }
                    : {},

                // Category Filtering
                query.category ? { category: query.category } : {},

                // Availability Filtering
                query.isAvailable
                    ? { isAvailable: query.isAvailable as AvailabilityStatus }
                    : {},

                // Filtering by Landlord
                query.landLord ? { landLord: query.landLord } : {},

                // Location Filtering
                query.location
                    ? {
                          location: {
                              contains: query.location as string,
                              mode: "insensitive",
                          },
                      }
                    : {},

                // Filterig By Price
                query.price ? { price: query.price } : {},
            ],
        },

        take: limit,
        skip: page,

        orderBy: {
            [sortBy]: sortOrder,
        },
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
