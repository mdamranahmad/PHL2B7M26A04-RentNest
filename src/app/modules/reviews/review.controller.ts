import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { isLoggedIn } from "../../utils/isLoggedIn";
import { IReview } from "./reviews.interface";
import { reviewService } from "./reviews.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const postReview = catchAsync(async (req: Request, res: Response) => {
    isLoggedIn(req);

    const payload = req.body as IReview;

    const reviewerId = req.user?.id as string;

    const review = await reviewService.postReview(payload, reviewerId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Review Posted Successfully.",
        data: review,
    });
});

const getReviewByUser = catchAsync(async (req: Request, res: Response) => {
    isLoggedIn(req);

    const reviewerId = req.user?.id as string;

    const query = req.query;

    const reviews = await reviewService.getReviewByUser(reviewerId, query);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Reviews Fetched Successfully.",
        data: reviews,
    });
});

export const reviewController = {
    postReview,
    getReviewByUser,
};
