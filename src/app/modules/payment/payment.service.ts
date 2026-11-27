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

        // console.log("checkoutSession: ", checkoutSession);

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

const getPaymentHistory = async (customerId: string) => {
    return await prisma.payment.findMany({
        where: {
            customerId,
        },
    });
};
const getPaymentDetails = async (customerId: string, paymentId: string) => {
    return await prisma.payment.findUniqueOrThrow({
        where: {
            id: paymentId,
            customerId,
        },
        include: {
            rentalRequest: true,
        },
    });
};

export const paymentService = {
    createCheckoutSession,
    handleWebhook,
    getSubscriptionStatus,
    getPaymentHistory,
    getPaymentDetails,
};

/*
model Payment {
  id            String                @id @default(uuid())
  transactionId String                @unique
  amount        Decimal               @db.Decimal(10, 2)
  method        String?
  provider      PaymentMethodProvider
  status        PaymentStatus         @default(PENDING)
  paidAt        DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  rentalRequestId String
  rentalRequest   RentalRequest @relation(fields: [rentalRequestId], references: [id], onDelete: Cascade)

  customerId String @unique
  customer   User   @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@map("payments")
}




session:  {
  id: 'cs_test_a1Hw5Q0SeFwsAXsrNcn8mfu86dmpStzRznvANLV1ri6nduMsNzpRBf8BWr',
  object: 'checkout.session',
  adaptive_pricing: { enabled: true },
  after_expiration: null,
  allow_promotion_codes: null,
  amount_subtotal: 19900,
  amount_total: 19900,
  automatic_tax: { enabled: false, liability: null, provider: null, status: null },
  billing_address_collection: null,
  branding_settings: {
    background_color: '#ffffff',
    border_style: 'rounded',
    button_color: '#0074d4',
    display_name: '',
    font_family: 'default',
    icon: null,
    logo: null
  },
  cancel_url: 'http://localhost:3000/payment?success=false',
  client_reference_id: null,
  client_secret: null,
  collected_information: {
    business_name: null,
    individual_name: null,
    shipping_details: null
  },
  consent: null,
  consent_collection: null,
  created: 1785442961,
  currency: 'usd',
  currency_conversion: null,
  custom_fields: [],
  custom_text: {
    after_submit: null,
    shipping_address: null,
    submit: null,
    terms_of_service_acceptance: null
  },
  customer: 'cus_UyyQzaX8ALiJqH',
  customer_account: null,
  customer_creation: null,
  customer_details: {
    address: {
      city: null,
      country: 'BD',
      line1: null,
      line2: null,
      postal_code: null,
      state: null
    },
    business_name: null,
    email: 'tenant01@email.com',
    individual_name: null,
    name: 'tenant01',
    phone: null,
    tax_exempt: 'none',
    tax_ids: []
  },
  customer_email: null,
  discounts: [],
  expires_at: 1785529361,
  integration_identifier: null,
  invoice: 'in_1Tz0UZGjtZKM4saurH0eQE3x',
  invoice_creation: null,
  livemode: false,
  locale: null,
  managed_payments: { enabled: false },
  metadata: {
    propertyId: '5a3320ee-d7e2-40b2-bcc8-b703959c9d3e',
    userId: '176902a4-2db6-4345-95e4-00280bcd9b5a',
    rentRequestId: '6057a20a-a124-47b8-9e26-54a5a27bc3ff'
  },
  mode: 'subscription',
  origin_context: null,
  payment_intent: null,
  payment_link: null,
  payment_method_collection: 'always',
  payment_method_configuration_details: null,
  payment_method_options: { card: { request_three_d_secure: 'automatic' } },
  payment_method_types: [ 'card' ],
  payment_status: 'paid',
  permissions: null,
  phone_number_collection: { enabled: false },
  presentment_details: { presentment_amount: 2555750, presentment_currency: 'bdt' },
  recovered_from: null,
  saved_payment_method_options: {
    allow_redisplay_filters: [ 'always' ],
    payment_method_remove: 'disabled',
    payment_method_save: null
  },
  setup_intent: null,
  shipping_address_collection: null,
  shipping_cost: null,
  shipping_options: [],
  status: 'complete',
  submit_type: null,
  subscription: 'sub_1Tz0UbGjtZKM4sauD87lQ7Pr',
  success_url: 'http://localhost:3000/properties/5a3320ee-d7e2-40b2-bcc8-b703959c9d3e?success=true',
  total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
  ui_mode: 'hosted_page',
  url: null,
  wallet_options: null
}
{
  subscriberId: '176902a4-2db6-4345-95e4-00280bcd9b5a',
  stripeCustomerId: 'cus_UyyQzaX8ALiJqH',
  stripeSubscriptionId: 'sub_1Tz0UbGjtZKM4sauD87lQ7Pr',
  propertyId: '5a3320ee-d7e2-40b2-bcc8-b703959c9d3e',
  rentRequestId: '6057a20a-a124-47b8-9e26-54a5a27bc3ff'
}
*/
