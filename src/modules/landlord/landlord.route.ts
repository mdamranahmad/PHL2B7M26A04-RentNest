import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { landlordController } from "./landlord.controller";

const router = Router();

// Implementation of auth middleware to ensure only user with admin/landlord role have access to module routes
router.use(auth(Role.ADMIN, Role.LANDLORD));

router.post("/properties", landlordController.createProperties);
router.put("/properties/:id", landlordController.updateProperties);
router.post("/properties/:id", landlordController.deleteProperties);
router.post("/requests", landlordController.rentalRequestForProperties);
router.post(
    "/requests/:id",
    landlordController.rentalRequestApprovalForProperties,
);

export const landlordRoutes = router;
