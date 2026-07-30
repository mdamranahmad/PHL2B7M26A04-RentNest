import { Category, User } from "../../../generated/prisma/client";
import {
    AvailabilityStatus,
    UserStatus,
} from "../../../generated/prisma/enums";
import { PropertyWhereInput } from "../../../generated/prisma/models";

export interface IUpdateStatus {
    status: UserStatus;
}

export interface IPropertyQuery extends PropertyWhereInput {
    // title?: string;
    // location?: string;
    // price?: string;
    // amenities?: string;
    // isAvailable?: AvailabilityStatus;
    // category?: Category;
    // landLord?: User;

    searchTerm?: string;
    page?: string;
    limit?: string;
    sortOrder?: string;
    sortBy?: string;
}
