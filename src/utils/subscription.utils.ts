import Stripe from "stripe";
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import {
    PaymentStatus,
    SubscriptionStatus,
} from "../../generated/prisma/enums";

export const getPeriodEnd = (payload: Stripe.Subscription) => {
    const currentPeriodEndInMs = payload.items.data[0]?.current_period_end!;

    const currentPeriodEnd = new Date(currentPeriodEndInMs * 1000);

    return currentPeriodEnd;
};

export const handleEventCheckoutComplete = async (
    session: Stripe.Checkout.Session,
) => {
    // console.log("session: ", session);
    const subscriberId = session.metadata?.userId as string;
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;
    // typeof session.subscription === "string"
    //     ? session.subscription
    //     : session.subscription?.id;
    const propertyId = session.metadata?.propertyId as string;
    const rentRequestId = session.metadata?.rentRequestId as string;

    const transactionId = session.id as string;
    const amount = Number(session.amount_total) / 100;
    const method = session.payment_method_types?.[0];
    const provider = "STRIPE";
    const status =
        session.payment_status === "paid"
            ? "COMPLETED"
            : session.payment_status === "unpaid"
              ? "PENDING"
              : "FAILED";
    const paidAt = session.payment_status === "paid" ? new Date() : null;

    // console.log({
    //     subscriberId,
    //     stripeCustomerId,
    //     stripeSubscriptionId,
    //     propertyId,
    //     rentRequestId,
    // });

    if (
        !subscriberId ||
        !stripeCustomerId ||
        !stripeSubscriptionId ||
        !propertyId ||
        !rentRequestId
    ) {
        console.log("Webhook: Missing Values to Initiate Checkout Session");
        return;
    }

    const stripeSubscription =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const currentPeriodEnd = getPeriodEnd(stripeSubscription);

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
    await prisma.payment.upsert({
        where: {
            customerId: subscriberId,
        },
        create: {
            customerId: subscriberId,
            transactionId,
            amount,
            method,
            provider,
            status,
            paidAt,
            rentalRequestId: rentRequestId,
        },
        update: {
            transactionId,
            amount,
            method,
            provider,
            status,
            paidAt,
            rentalRequestId: rentRequestId,
        },
    });

    await prisma.property.update({
        where: {
            id: propertyId,
            isAvailable: "WAITING",
        },
        data: {
            isAvailable: "RENTED",
        },
    });

    await prisma.rentalRequest.update({
        where: {
            id: rentRequestId,
            propertyId: propertyId,
            tenantId: subscriberId,
            rentRequestStatus: "PAYMENT_PENDING",
        },
        data: {
            rentRequestStatus: "APPROVED",
        },
    });
};

export const handleEventSubscriptionUpdate = async (
    payload: Stripe.Subscription,
) => {
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
