import { NextFunction, Request, RequestHandler, Response } from "express";

// A function that return an async function for successfull execution
export const catchAsync = (fn: RequestHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};
