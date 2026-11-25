import { Role, UserStatus } from "../../../generated/prisma/enums";

// export interface IUser {
//     name: string;
//     email: string;
//     password: string;
//     age?: number;
//     contactNo?: string;
//     profilePhoto?: string;
//     role: Role;
//     status?: UserStatus;
//     tenantRequests?: string;
//     landLordRequests?: string;
//     reviews?: string;
//     properties?: string;
// }

export interface IUserRegisterPayload {
    name: string;
    email: string;
    password: string;
}

export interface IVerifyEmail {
    email: string;
    otp: string;
}

export interface IRedisRegisterPayload {
    name: string;
    email: string;
    passwordHash: string;
    otpValue: string;
}

export interface ILoginUser {
    email: string;
    password: string;
}
