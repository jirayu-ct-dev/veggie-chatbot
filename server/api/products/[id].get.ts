import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
    const id = parseInt(getRouterParam(event, "id") || "0");

    const product = await prisma.product.findUnique({
        where: { id },
    });

    if (!product) {
        throw createError({
            statusCode: 404,
            statusMessage: "ไม่พบสินค้า",
        });
    }

    return product;
});
