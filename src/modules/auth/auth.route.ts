import { Router } from "express";
import { authController } from "./auth.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { UserValidation } from "./auth.validation";
import { validateResquest } from "../../middlewares/validateRequest";

const router = Router();

router.post(
    "/register",
    validateResquest(UserValidation.UserRegistrationZSchema),
    authController.registerUser,
);
router.post("/verify-email", authController.verifyEmail);
router.post("/google", authController.googleLogin);
router.post("/login", authController.loginUser);
router.post("/refresh-login", authController.loginUserWithRefreshToken);
router.get(
    "/me",
    auth(Role.ADMIN, Role.LANDLORD, Role.TENANT),
    authController.getProfile,
);

export const authRoutes = router;
