import { prisma } from "../../utils/db";
import { promises as fs } from "fs";
import { join } from "path";

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

    // ลบรูปภาพถ้ามี
    if (product.imageUrl) {
        try {
            const imagePath = join(process.cwd(), "public", product.imageUrl);
            await fs.unlink(imagePath);
        } catch {
            // ไม่เป็นไรถ้าลบรูปไม่ได้
        }
    }

    await prisma.product.delete({
        where: { id },
    });

    return { message: "ลบสินค้าเรียบร้อยแล้ว" };
});
