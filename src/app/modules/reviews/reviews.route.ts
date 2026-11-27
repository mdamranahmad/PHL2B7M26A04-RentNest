import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../../generated/prisma/enums";
import { reviewController } from "./review.controller";

const router = Router();

router.use(auth(Role.ADMIN, Role.LANDLORD, Role.TENANT));

router.post("/", reviewController.postReview);
router.get("/", reviewController.getReviewByUser);

export const reviewRoutes = router;
