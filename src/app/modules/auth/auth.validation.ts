import z from "zod";

const UserRegistrationZSchema = z.object({
    name: z
        .string("Not s string!")
        .min(2, "Name must contain atleast 2 characters!")
        .max(100),
    email: z.email(),
    password: z
        .string()
        .min(8, "Password must contain 8 characters!")
        .regex(/[A-Z]/, "At least 1 uppercase letter!")
        .regex(/[a-z]/, "At least 1 lowercase letter!")
        .regex(/[0-9]/, "At least 1 number!"),
});

const EmailVerificationZSchema = z.object({
    email: z.email(),
    otp: z
        .string()
        .min(6, "OTP must has six digit!")
        .regex(/[0-9]/, "Only digits are allowed!"),
});

const UserLoginZSchema = z.object({
    email: z.email(),
    password: z
        .string()
        .min(8, "Password must contain 8 characters!")
        .regex(/[A-Z]/, "At least 1 uppercase letter!")
        .regex(/[a-z]/, "At least 1 lowercase letter!")
        .regex(/[0-9]/, "At least 1 number!"),
});

const ForgetPasswordZSchema = z.object({
    email: z.email(),
});

const ResetPasswordZSchema = z.object({
    email: z.email(),
    otpValue: z
        .string()
        .min(6, "OTP must has six digit!")
        .regex(/[0-9]/, "Only digits are allowed!"),
    password: z
        .string()
        .min(8, "Password must contain 8 characters!")
        .regex(/[A-Z]/, "At least 1 uppercase letter!")
        .regex(/[a-z]/, "At least 1 lowercase letter!")
        .regex(/[0-9]/, "At least 1 number!"),
});

export const UserValidation = {
    UserRegistrationZSchema,
    EmailVerificationZSchema,
    UserLoginZSchema,
    ForgetPasswordZSchema,
    ResetPasswordZSchema,
};
