import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { AppError } from "../middlewares/appError";
import httpStatus from "http-status";

const createToken = (
    payload: JwtPayload,
    secret: string,
    expiresIn: SignOptions,
) => {
    const token = jwt.sign(payload, secret, { expiresIn } as SignOptions);

    return token;
};

const tokenVerification = (token: string, secretKey: string) => {
    try {
        return jwt.verify(token, secretKey);
    } catch (error) {
        console.log("Token Verification Error: ", error);
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            "Invalid or Expired Token.",
        );
    }
};

export const jwtUtils = {
    createToken,
    tokenVerification,
};
