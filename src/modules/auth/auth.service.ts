import config from "../../config";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/appError";
import { ILoginUser, IUser } from "./auth.interface";
import bcrypt from "bcrypt";
import httpStatus from "http-status";

// ================================================================
// A function to register user into the system
// ================================================================
const registerUser = async (payload: IUser) => {
    // Striping password and relations which are unavailale during registration from payload
    const {
        password,
        tenantRequests,
        landLordRequests,
        properties,
        reviews,
        ...userPayload
    } = payload;

    // Checks if the user already exists in the system
    const isUserExists = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (isUserExists) {
        throw new AppError(httpStatus.CONFLICT, "User Already Exists.");
    }

    // Create password hash for security concern
    const passwordHash = await bcrypt.hash(
        password,
        Number(config.bcrypt_salt_rounds),
    );

    // Register user into the system
    const registeredUser = await prisma.user.create({
        data: { ...userPayload, passwordHash },
    });

    // Fetch Registered user from database
    const user = await prisma.user.findUnique({
        where: { id: registeredUser.id },
        omit: { passwordHash: true },
    });

    return user;
};

// // ================================================================
// // A function to login user into the system
// // ================================================================
// const loginUser = async (payload: ILoginUser) => {
//     const { email, password } = payload;
// };

export const authService = {
    registerUser,
    // loginUser,
};
