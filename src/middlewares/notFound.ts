import { Request, Response } from "express";
import httpStatus from "http-status";

export const notFound = (req: Request, res: Response) => {
    res.status(httpStatus.NOT_FOUND).json({
        message: "404! Not Found",
        path: req.originalUrl,
        date: Date(),
    });
};
