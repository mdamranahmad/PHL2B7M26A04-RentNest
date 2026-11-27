import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../../generated/prisma/enums";
import { landlordController } from "./landlord.controller";

const router = Router();

// Implementation of auth middleware to ensure only user with admin/landlord role have access to module routes
router.use(auth(Role.ADMIN, Role.LANDLORD));

router.get("/properties", landlordController.getAllPropertiesForUser);
router.post("/properties", landlordController.createProperties);
router.put("/properties/:id", landlordController.updateProperties);
router.delete("/properties/:id", landlordController.deleteProperties);
router.get("/requests", landlordController.rentalRequestsForLandlord);
router.patch("/requests/:id", landlordController.updateRentRequestStatus);

export const landlordRoutes = router;
