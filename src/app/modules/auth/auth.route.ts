import { Router } from "express";
import { authController } from "./auth.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../../generated/prisma/enums";
import { UserValidation } from "./auth.validation";
import { validateResquest } from "../../middlewares/validateRequest";

const router = Router();

router.post(
    "/register",
    validateResquest(UserValidation.UserRegistrationZSchema),
    authController.registerUser,
);
router.post(
    "/verify-email",
    validateResquest(UserValidation.EmailVerificationZSchema),
    authController.verifyEmail,
);

router.post("/google", authController.googleLogin);
router.post(
    "/login",
    validateResquest(UserValidation.UserLoginZSchema),
    authController.loginUser,
);
router.post("/refresh-login", authController.loginUserWithRefreshToken);
router.get(
    "/me",
    auth(Role.ADMIN, Role.LANDLORD, Role.TENANT),
    authController.getProfile,
);
router.post(
    "/forget-password",
    validateResquest(UserValidation.ForgetPasswordZSchema),
    authController.forgetPassword,
);
router.post(
    "/reset-password",
    validateResquest(UserValidation.ResetPasswordZSchema),
    authController.resetPassword,
);

export const authRoutes = router;
