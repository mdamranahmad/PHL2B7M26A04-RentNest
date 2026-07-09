import { Role, UserStatus } from "../../../generated/prisma/enums";

export interface IUser {
    name: string;
    email: string;
    password: string;
    age?: number;
    contactNo?: string;
    profilePhoto?: string;
    role: Role;
    status?: UserStatus;
    tenantRequests?: string;
    landLordRequests?: string;
    reviews?: string;
    properties?: string;
}

export interface ILoginUser {
    email: string;
    password: string;
}
