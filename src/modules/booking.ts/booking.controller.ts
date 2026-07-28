import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { bookingService } from "./booking.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createCheckoutSession = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id as string;

        const result = await bookingService.createCheckoutSession(userId);

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
        const signature = req.headers["stripe-signature"]!;

        await bookingService.handleWebhook(event, signature as string);

        //     let event = req.body;
        //     console.log("Request Body: ", JSON.parse(req.body));
        //     console.log("Request Headers: ", req.headers);

        //     if (endpointSecret) {
        //         const signature = req.headers["stripe-signature"]!;
        //         try {
        //             event = stripe.webhooks.constructEvent(
        //                 req.body,
        //                 signature,
        //                 endpointSecret,
        //             );
        //         } catch (error: any) {
        //             console.log(
        //                 `Webhook Signature Verification Failed.`,
        //                 error.message,
        //             );
        //             return response.sendStatus(400).json({
        //                 message: error.message,
        //             });
        //         }
        //     }

        //     console.log("Event after Verification: ", event);

        //     switch (event.type) {
        //         case "payment_intent.succeded":
        //             const paymentIntent = event.data.object;
        //             console.log(
        //                 `PaymentIntent for ${paymentIntent.amoun} was successful!`,
        //             );
        //             break;
        //         case "payment_method:attached":
        //             const paymentMethod = event.data.object;
        //             break;
        //         default:
        //             console.log(`Unhandled event type ${event.type}`);
        //     }
    },
);

export const bookingController = { createCheckoutSession, handleWebhook };
