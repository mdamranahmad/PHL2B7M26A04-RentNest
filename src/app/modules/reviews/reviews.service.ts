import { ReviewWhereInput } from "../../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import { IReview, IReviewQuery } from "./reviews.interface";
import httpStatus from "http-status";

const postReview = async (payload: IReview, reviewerId: string) => {
    const { rating, comment, propertyId } = payload;

    const isRatingValid = rating >= 0 && rating <= 5;

    if (!isRatingValid) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Rating must be a number between 0 to 5",
        );
    }

    const isReviewerAvailable = await prisma.user.findUnique({
        where: {
            id: reviewerId,
            tenantRequests: {
                some: {
                    propertyId,
                    AND: { payments: { some: { status: "COMPLETED" } } },
                    rentRequestStatus: "APPROVED",
                },
            },
        },
    });

    if (!isReviewerAvailable) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "User not found or is not authorized to post review!",
        );
    }

    return await prisma.review.create({
        data: { rating, comment, propertyId, reviewerId },
    });
};

const getReviewByUser = async (reviewerId: string, query: IReviewQuery) => {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder ? query.sortOrder : "desc";

    const searchCondition: ReviewWhereInput[] = [];

    if (query.searchTerm && typeof query.searchTerm === "string") {
        searchCondition.push(
            {
                comment: { contains: query.searchTerm, mode: "insensitive" },
            },
            {
                propertyId: { equals: query.searchTerm },
            },
        );
    }

    const whereConditions: ReviewWhereInput = {
        AND: [
            { reviewerId },
            ...(searchCondition.length > 0 ? [{ OR: searchCondition }] : []),
        ],
    };

    const total = await prisma.review.count({
        where: whereConditions,
    });

    const results = await prisma.review.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
    });

    return {
        metadata: { page, limit, total, totalPage: Math.ceil(total / limit) },
        reviews: results,
    };
};

export const reviewService = {
    postReview,
    getReviewByUser,
};
