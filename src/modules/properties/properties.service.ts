import { prisma } from "../../lib/prisma";

const getPropertyDetails = async (id: string) => {
    return await prisma.property.findUniqueOrThrow({
        where: { id },
        omit: {
            categoryId: true,
            landLordId: true,
        },
        include: {
            category: { select: { categoryType: true } },
            landLord: { select: { name: true } },
        },
    });
};

export const propertyService = {
    getPropertyDetails,
};
