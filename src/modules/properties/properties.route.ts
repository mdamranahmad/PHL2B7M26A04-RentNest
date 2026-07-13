import { Router } from "express";
import { adminController } from "../admin/admin.controller";
import { propertyController } from "./properties.controller";

const router = Router();

router.get("/", adminController.getAllProperties);
router.get("/:id", propertyController.getPropertyDetails);


export const PropertyRoutes = router;
