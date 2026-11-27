import {
    AvailabilityStatus,
    CategoryType,
    Role,
    UserStatus,
} from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { IPropertyQuery, IUpdateStatus, IUserQuery } from "./admin.interface";
import {
    PropertyWhereInput,
    UserWhereInput,
} from "../../../../generated/prisma/models";

// ================================================================
// A function to get all users profile from the system
// ================================================================
const getAllUsers = async (query: IUserQuery) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const searchConditions: UserWhereInput[] = [];

    if (query.searchTerm && typeof query.searchTerm === "string") {
        const upperSearchTerm = query.searchTerm.toUpperCase();
        const isValidRoleEnum = Object.values(Role).includes(
            upperSearchTerm as Role,
        );
        const isValidUserStatusEnum = Object.values(UserStatus).includes(
            upperSearchTerm as UserStatus,
        );

        searchConditions.push(
            {
                name: { contains: query.searchTerm, mode: "insensitive" },
            },
            {
                email: { contains: query.searchTerm, mode: "insensitive" },
            },
            {
                id: { contains: query.searchTerm, mode: "insensitive" },
            },
            { contactNo: { contains: query.searchTerm } },
        );

        if (isValidRoleEnum) {
            searchConditions.push({
                role: upperSearchTerm as Role,
            });
        }

        if (isValidUserStatusEnum) {
            searchConditions.push({
                status: upperSearchTerm as UserStatus,
            });
        }
    }

    const andCondition: UserWhereInput[] = [];

    if (searchConditions.length > 0) {
        andCondition.push({ OR: searchConditions });
    }

    if (query.name) {
        andCondition.push({
            name: {
                contains: query.name as string,

                mode: "insensitive",
            },
        });
    }

    if (query.role) {
        andCondition.push({
            role: {
                equals: query.role as Role,
            },
        });
    }

    if (query.email) {
        andCondition.push({
            email: {
                contains: query.email as string,

                mode: "insensitive",
            },
        });
    }

    if (query.status) {
        andCondition.push({
            status: {
                equals: query.status as UserStatus,
            },
        });
    }

    const whereConditions: UserWhereInput =
        andCondition.length > 0 ? { AND: andCondition } : {};

    const total = await prisma.user.count({
        where: whereConditions,
    });

    const result = await prisma.user.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        omit: { passwordHash: true },
        include: {
            properties: {
                select: { title: true, description: true, location: true },
            },
        },
    });

    return {
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
        users: result,
    };
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
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const skip = (page - 1) * limit;
    const searchUpper = query.searchTerm ? query.searchTerm.toUpperCase() : "";
    const isCategoryEnum = Object.values(CategoryType).includes(
        searchUpper as CategoryType,
    );

    const whereConditions: PropertyWhereInput = {
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
                          //   mode: "insensitive",
                      },
                  }
                : {},

            // Category Filtering
            query.category || query.categoryType
                ? {
                      category: {
                          categoryType: {
                              equals: (
                                  (query.category ||
                                      query.categoryType) as string
                              )?.toUpperCase() as CategoryType,
                          },
                      },
                  }
                : {},

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
    };

    const total = await prisma.property.count({
        where: whereConditions,
    });
    const results = await prisma.property.findMany({
        // Implement Query
        where: whereConditions,
        take: limit,
        skip,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            category: { select: { categoryType: true } },
            landLord: { select: { name: true } },
            _count: { select: { rentalRequests: true, reviews: true } },
            rentalRequests: {
                select: {
                    rentRequestStatus: true,
                    tenant: { select: { name: true } },
                },
            },
            reviews: { select: { id: true, rating: true, comment: true } },
        },
    });

    return {
        metadata: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
        properties: results,
    };
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
