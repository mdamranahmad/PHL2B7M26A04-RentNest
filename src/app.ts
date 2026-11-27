import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./app/config";
import cookieParser from "cookie-parser";
import { authRoutes } from "./app/modules/auth/auth.route";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { notFound } from "./app/middlewares/notFound";
import { landlordRoutes } from "./app/modules/landlord/landlord.route";
import { categoriesRoutes } from "./app/modules/categories/categories.route";
import { adminRoutes } from "./app/modules/admin/admin.route";
import { propertyRoutes } from "./app/modules/properties/properties.route";
import { adminController } from "./app/modules/admin/admin.controller";
import { categoriesController } from "./app/modules/categories/categories.controller";
import { rentalRequestRoutes } from "./app/modules/rentals/rentals.route";
import { paymentRoutes } from "./app/modules/payment/payment.route";
import { reviewRoutes } from "./app/modules/reviews/reviews.route";

const app: Application = express();

// =================================================
// Middlewares
// =================================================
app.use(
    cors(
        //  Cross-Origin Resource Sharing
        {
            origin: config.app_url, //  Allowed domain to talk to APIs
            credentials: true, //  allows to accept and send cookies, authorization headers
        },
    ),
);

app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

app.use(express.json()); //  parses raw data-stream (json or form submission) into json, writes into req.body

app.use(
    express.urlencoded({
        //  parses url-encoded form data (form submission)
        extended: true, //  use qs library to parse nested objects and arrays
    }),
);

app.use(cookieParser()); // Reads active JWT tokens, populates req.cookies

// =====================================================
// App Routes
// =====================================================

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World");
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/landlord", landlordRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/properties", propertyRoutes);
app.get("/api/categories", categoriesController.getAllCategories);
app.use("/api/rentals", rentalRequestRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/reviews", reviewRoutes);

// Implementation of middleware for url Not Found
app.use(notFound);

// Implementation of global error handler
app.use(globalErrorHandler);

export default app;
