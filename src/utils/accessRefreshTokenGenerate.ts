import { SignOptions } from "jsonwebtoken";
import { Role } from "../../generated/prisma/enums";
import config from "../config";
import { jwtUtils } from "./jwt";

type TTokenPayload = {
    userId: string;
    name: string;
    email: string;
    role: Role;
};

export const accessRefreshTokenGenerate = (payload: TTokenPayload) => {
    // Generation of Access Token
    const accessToken = jwtUtils.createToken(
        payload,
        config.jwt_secret_key,
        config.jwt_secret_key_expires_in as SignOptions,
    );

    // Generation of Refresh Token
    const refreshToken = jwtUtils.createToken(
        payload,
        config.jwt_refresh_secret_key,
        config.jwt_refresh_secret_key_expires_in as SignOptions,
    );

    return { accessToken, refreshToken };
};
