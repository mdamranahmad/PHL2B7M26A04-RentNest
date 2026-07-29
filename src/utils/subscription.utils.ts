import Stripe from "stripe";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import { SubscriptionStatus } from "../../generated/prisma/enums";

export const getPeriodEnd = (payload: Stripe.Subscription) => {
    const currentPeriodEndInMs = payload.items.data[0]?.current_period_end!;

    const currentPeriodEnd = new Date(currentPeriodEndInMs * 1000);

    return currentPeriodEnd;
};

export const handleEventCheckoutComplete = async (
    session: Stripe.Checkout.Session,
) => {
    const subscriberId = session.metadata?.userId as string;
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    if (!subscriberId || !stripeCustomerId || !stripeSubscriptionId) {
        console.log("Webhook: Missing Values to Initiate Checkout Session");
        return;
    }

    const stripeSuscription =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);

    // console.log("Stripe Sub Info: ", stripeSuscription.items.data[0]);

    const currentPeriodEnd = getPeriodEnd(stripeSuscription);

    // console.log(currentPeriodEnd);

    await prisma.subscription.upsert({
        where: {
            subscriberId,
        },
        create: {
            subscriberId,
            stripeCustomerId,
            stripeSubscriptionId,
            status: "ACTIVE",
            currentPeriodEnd,
        },
        update: {
            stripeCustomerId,
            stripeSubscriptionId,
            status: "ACTIVE",
            currentPeriodEnd,
        },
    });
};

export const handleEventSubscriptionUpdate = async (payload: Stripe.Subscription) => {
    const stripeSubscriptionId = payload.id;

    const status =
        payload.status === "active" || payload.status === "trialing"
            ? SubscriptionStatus.ACTIVE
            : payload.status === "canceled"
              ? SubscriptionStatus.CANCELLED
              : SubscriptionStatus.EXPIRED;

    const currentPeriodEnd = getPeriodEnd(payload);

    const isSubscriptionExist = await prisma.subscription.findMany({
        where: {
            stripeSubscriptionId,
        },
    });

    if (!isSubscriptionExist) {
        console.log(
            `Webhook: No Subscription Found for Subscription Id: ${stripeSubscriptionId}`,
        );

        return;
    }

    await prisma.subscription.update({
        where: {
            stripeSubscriptionId,
        },
        data: {
            status,
            currentPeriodEnd,
        },
    });
};
