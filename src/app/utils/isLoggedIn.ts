import { Request } from "express";
import { AppError } from "../middlewares/appError";
import httpStatus from "http-status";

export const isLoggedIn = (req: Request) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authorization Required!");
    }
};
