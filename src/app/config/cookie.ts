import { CookieOptions } from "express";
import config from ".";

export const defaultCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: config.node_env === "development" ? false : true,
    sameSite: config.node_env === "development" ? "lax" : "none",
    partitioned: config.node_env !== "development",
    path: "/", // Explocot root path matching
};
