import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../config";

export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    let message = err.message || "Something Went Wrong";
    console.log("SYSTEM ERROR LOG: ", err);
    res.status(statusCode).json({
        success: false,
        message,
        error: config.node_env === "development" ? err.stack : undefined,
    });
};
