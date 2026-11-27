import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../../generated/prisma/enums";
import { adminController } from "./admin.controller";

const router = Router();

// Only Admin can access these routes
router.use(auth(Role.ADMIN));

router.get("/users", adminController.getAllUsers);
router.patch("/users/:id", adminController.updateUserStatus);
router.get("/properties", adminController.getAllProperties);
router.get("/rentals", adminController.getAllRentalRequests);

export const adminRoutes = router;
