import Stripe from "stripe";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import { SubscriptionStatus } from "../../../generated/prisma/enums";
import {
    handleEventCheckoutComplete,
    handleEventSubscriptionUpdate,
} from "../../utils/subscription.utils";

const createCheckoutSession = async (userId: string) => {
    const transactionResult = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({
            where: { id: userId },
            include: { subscription: true },
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

        const checkoutSession = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: config.stripe_price_id,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            customer: stripeCustomerId,
            payment_method_types: ["card"],
            success_url: `${config.app_url}/properties?success=true`,
            cancel_url: `${config.app_url}/payment?success=false`,
            metadata: { userId: user.id },
        });

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

export const bookingService = { createCheckoutSession, handleWebhook };
