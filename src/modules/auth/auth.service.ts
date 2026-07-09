import config from "../../config";
import { prisma } from "../../lib/prisma";
import { IUser } from "./auth.interface";
import bcrypt from "bcrypt";

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
        throw new Error("User Already Exists!");
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

export const authService = {
    registerUser,
};
