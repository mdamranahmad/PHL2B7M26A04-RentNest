import { UserStatus } from "../../../generated/prisma/enums";

export interface IUpdateStatus {
    status: UserStatus;
}
