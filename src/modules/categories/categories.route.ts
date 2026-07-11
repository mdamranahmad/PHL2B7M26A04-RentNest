import { Router } from "express";
import { categoriesController } from "./categories.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// Every single route requires admin access
router.use(auth(Role.ADMIN));

router.get("/", categoriesController.getAllCategories);
router.post("/add", categoriesController.addCategory);
router.patch("/:categoryTypeId", categoriesController.updateCategory);
router.delete("/:categoryTypeId", categoriesController.deleteCategory);

export const categoriesRoutes = router;
