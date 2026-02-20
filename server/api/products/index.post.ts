import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    const product = await prisma.product.create({
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
