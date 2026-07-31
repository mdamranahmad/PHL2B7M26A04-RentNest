import { RentalRequestWhereInput } from "../../../generated/prisma/models";

export interface IRentalRequest extends RentalRequestWhereInput {
    searchTerm?: string;
    page?: string;
    limit?: string;
    sortOrder?: string;
    sortBy?: string;
}
