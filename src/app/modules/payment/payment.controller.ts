import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { paymentService } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createCheckoutSession = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id as string;

        const { propertyId } = req.body;

        const result = await paymentService.createCheckoutSession(
            userId,
            propertyId,
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Checkout Completed Successfully",
            data: result,
        });
    },
);

const handleWebhook = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const event = req.body;
        // console.log(JSON.parse(event));
        const signature = req.headers["stripe-signature"]!;
        await paymentService.handleWebhook(event, signature as string);
        res.status(200).json({ received: true });
    },
);

const getSubscriptionStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id as string;

        const result = await paymentService.getSubscriptionStatus(userId);
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Subscription Status Retrieved Successfully.",
            data: result,
        });
    },
);
const getPaymentHistory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id as string;

        const result = await paymentService.getPaymentHistory(userId);
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Payment History Retrieved Successfully.",
            data: result,
        });
    },
);

const getPaymentDetails = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id as string;
        const paymentId = req.params?.id as string;

        const result = await paymentService.getPaymentDetails(
            userId,
            paymentId,
        );
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Payment Details Retrieved Successfully.",
            data: result,
        });
    },
);

export const paymentController = {
    createCheckoutSession,
    handleWebhook,
    getSubscriptionStatus,
    getPaymentHistory,
    getPaymentDetails,
};
