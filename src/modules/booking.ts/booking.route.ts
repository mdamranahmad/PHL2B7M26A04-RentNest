import { Router } from "express";
import { bookingController } from "./booking.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
    "/checkout",
    auth(Role.ADMIN, Role.LANDLORD, Role.TENANT),
    bookingController.createCheckoutSession,
);

router.post("/webhook", () =>{})

export const bookingRoutes = router;
