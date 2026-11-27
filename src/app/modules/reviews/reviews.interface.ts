import { ReviewWhereInput } from "../../../../generated/prisma/models";

export interface IReview {
    rating: number;
    comment: string;
    propertyId: string;
}

export interface IReviewQuery extends ReviewWhereInput {
    searchTerm?: string;
    page?: string;
    limit?: string;
    sortOrder?: string;
    sortBy?: string;
}
