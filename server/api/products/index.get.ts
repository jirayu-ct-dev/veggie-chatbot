import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const search = (query.search as string) || "";
    const category = (query.category as string) || "";

    const where: any = {};

    if (search) {
        where.name = {
            contains: search,
            mode: "insensitive",
        };
    }

    if (category && category !== "ALL") {
        where.category = category;
    }

    const products = await prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
    });

    return products;
});
