import { promises as fs } from "fs";
import { join } from "path";

export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: "ไม่พบไฟล์ที่อัปโหลด",
        });
    }

    const file = formData[0];
    if (!file || !file.filename) {
        throw createError({
            statusCode: 400,
            statusMessage: "ไม่พบชื่อไฟล์",
        });
    }

    // สร้างชื่อไฟล์ที่ไม่ซ้ำ
    const ext = file.filename.split(".").pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
    const uploadsDir = join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // บันทึกไฟล์
    const filePath = join(uploadsDir, uniqueName);
    await fs.writeFile(filePath, file.data);

    return {
        url: `/uploads/${uniqueName}`,
    };
});
