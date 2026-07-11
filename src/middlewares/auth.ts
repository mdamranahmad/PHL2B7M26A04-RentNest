import { NextFunction, Request, Response } from "express";
import { Role } from "../../generated/prisma/enums";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "./appError";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { prisma } from "../lib/prisma";

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                email: string;
                role: Role;
            };
        }
    }
}

export const auth = (...requiredRoles: Role[]) => {
    return catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
            const token = req.cookies.accessToken
                ? req.cookies.accessToken
                : req.headers.authorization?.startsWith("Bearer ")
                  ? req.headers.authorization.split(" ")[1]
                  : req.headers.authorization;

            if (!token) {
                throw new AppError(
                    httpStatus.UNAUTHORIZED,
                    "Authentication Required. Please log in to access this resource",
                );
            }

            const varifiedToken = jwtUtils.tokenVerification(
                token,
                config.jwt_secret_key,
            );

            console.log(varifiedToken);

            const { id, name, email, role } = varifiedToken as JwtPayload;

            if (!requiredRoles.length && !requiredRoles.includes(role)) {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    "Access denied. You do not have the required role to perform this action.",
                );
            }

            const user = await prisma.user.findUniqueOrThrow({
                where: { id, name, email, role },
            });

            if (user.status === "BANNED") {
                throw new AppError(
                    httpStatus.FORBIDDEN,
                    "User Account Suspended",
                );
            }

            req.user = { id, name, email, role };
            next();
        },
    );
};
