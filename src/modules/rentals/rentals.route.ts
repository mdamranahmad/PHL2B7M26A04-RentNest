import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { rentalrequestController } from "./rentals.controller";

const router = Router();

router.use(auth(Role.ADMIN, Role.LANDLORD, Role.TENANT));

router.post("/", rentalrequestController.submitRentalRequest);
router.get("/", rentalrequestController.getRentalRequestsByUserId);
router.get("/:id", rentalrequestController.getRentalRequestDetails);
router.delete("/:id", rentalrequestController.deleteRentalRequestById);

export const rentalRequestRoutes = router;
