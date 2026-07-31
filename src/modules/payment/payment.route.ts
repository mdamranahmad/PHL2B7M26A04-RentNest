import { Router } from "express";
import { paymentController } from "./payment.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
    "/checkout",
    auth(Role.ADMIN, Role.LANDLORD, Role.TENANT),
    paymentController.createCheckoutSession,
);

router.post("/webhook", paymentController.handleWebhook);
router.get(
    "/status",
    auth(Role.ADMIN, Role.LANDLORD, Role.TENANT),
    paymentController.getSubscriptionStatus,
);
router.get("/", auth(Role.ADMIN, Role.LANDLORD, Role.TENANT), paymentController.getPaymentHistory);
router.get("/:id", auth(Role.ADMIN, Role.LANDLORD, Role.TENANT),paymentController.getPaymentDetails);

export const paymentRoutes = router;
