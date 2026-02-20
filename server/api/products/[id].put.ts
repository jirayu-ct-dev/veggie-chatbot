import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
    const id = parseInt(getRouterParam(event, "id") || "0");
    const body = await readBody(event);

    const product = await prisma.product.update({
        where: { id },
        data: {
            name: body.name,
            description: body.description || null,
            price: parseFloat(body.price),
            unit: body.unit,
            category: body.category,
            inStock: body.inStock ?? true,
            stockQty: parseFloat(body.stockQty) || 0,
            imageUrl: body.imageUrl || null,
        },
    });

    return product;
});
