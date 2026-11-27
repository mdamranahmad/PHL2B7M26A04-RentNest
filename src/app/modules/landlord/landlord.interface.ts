import {
    AvailabilityStatus,
    CategoryType,
} from "../../../../generated/prisma/enums";

export interface IProperties {
    title: string;
    description: string;
    location: string;
    price: number;
    amenities?: string[];
    thumbnail?: string;
    images?: string[];
    isAvailable?: AvailabilityStatus;
    category?: CategoryType;
    landLordId?: string;
    reviews?: string;
}

export interface IUpdateProperties {
    title?: string;
    description?: string;
    location?: string;
    price?: number;
    amenities?: string[];
    isAvailable?: AvailabilityStatus;
}
