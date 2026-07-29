import Stripe from "stripe";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import {
    handleEventCheckoutComplete,
    handleEventSubscriptionUpdate,
} from "../../utils/subscription.utils";

const createCheckoutSession = async (userId: string, propertyId: string) => {
    const transactionResult = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({
            where: { id: userId },
            include: {
                subscription: true,
                tenantRequests: {
                    where: {
                        propertyId,
                        rentRequestStatus: "PAYMENT_PENDING",
                    },
                    select: { id: true },
                },
            },
        });

        let stripeCustomerId = user.subscription?.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId: user.id },
            });

            stripeCustomerId = customer.id;
        }

        const isPropertyAvailable = await tx.property.findUniqueOrThrow({
            where: { id: propertyId, isAvailable: "WAITING" },
            include: {
                rentalRequests: {
                    where: {
                        propertyId,
                        tenantId: userId,
                        rentRequestStatus: "PAYMENT_PENDING",
                    },
                },
            },
        });

        const checkoutSession = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: isPropertyAvailable.title,
                            description: isPropertyAvailable.description,
                        },
                        unit_amount: isPropertyAvailable.price * 100,
                        recurring: {
                            interval: "month",
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: "subscription",
            customer: stripeCustomerId,
            payment_method_types: ["card"],
            success_url: `${config.app_url}/properties/${isPropertyAvailable.id}?success=true`,
            cancel_url: `${config.app_url}/payment?success=false`,
            metadata: {
                userId: user.id,
                propertyId: propertyId,
                rentRequestId: user.tenantRequests[0]?.id as string,
            },
        });

        console.log("checkoutSession: ", checkoutSession);

        return checkoutSession.url;
    });

    return {
        paymentUrl: transactionResult,
    };
};

const handleWebhook = async (payload: Buffer, signature: string) => {
    const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe_webhook_secret,
    );

    switch (event.type) {
        case "checkout.session.completed":
            // console.log(event.data.object);
            await handleEventCheckoutComplete(event.data.object);

            // const paymentIntent = event.data.object;

            break;
        case "customer.subscription.updated":
            await handleEventSubscriptionUpdate(event.data.object);

            break;
        case "customer.subscription.deleted":
            await handleEventSubscriptionUpdate(event.data.object);
            break;
        default:
            console.log(`Unhandled event type ${event.type}.`);
            break;
    }
};

const getSubscriptionStatus = async (subscriberId: string) => {
    const isSubscriptionExist = await prisma.subscription.findUniqueOrThrow({
        where: {
            subscriberId,
        },
    });

    const isActive =
        isSubscriptionExist.status === "ACTIVE" &&
        isSubscriptionExist.currentPeriodEnd &&
        new Date(isSubscriptionExist.currentPeriodEnd) > new Date();

    return {
        status: isSubscriptionExist.status,
        isSubscribed: isActive,
        currentPeriodEnd: isSubscriptionExist.currentPeriodEnd,
    };
};
export const bookingService = {
    createCheckoutSession,
    handleWebhook,
    getSubscriptionStatus,
};
