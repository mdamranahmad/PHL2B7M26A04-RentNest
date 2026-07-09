import express, { Application, Request, Response } from "express";
import cors from "cors";
import config from "./config";
import cookieParser from "cookie-parser";
import { authRoutes } from "./modules/auth/auth.route";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";

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
app.use("/api/auth", authRoutes);

// Implementation of middleware for url Not Found
app.use(notFound);

// Implementation of global error handler
app.use(globalErrorHandler);

export default app;
