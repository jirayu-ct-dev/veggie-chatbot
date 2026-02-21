// server/api/auth/line.post.ts
// รับข้อมูลจาก LIFF แล้วสร้าง/อัปเดต User ใน Database

import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { lineId, displayName, pictureUrl } = body

    if (!lineId) {
        throw createError({ statusCode: 400, statusMessage: 'lineId is required' })
    }

    // Upsert: ถ้ามี lineId อยู่แล้วให้ update, ถ้าไม่มีให้สร้างใหม่
    const user = await prisma.user.upsert({
        where: { lineId },
        update: {
            name: displayName,
            pictureUrl,
        },
        create: {
            lineId,
            name: displayName,
            pictureUrl,
            role: 'USER',
        },
    })

    return {
        id: user.id,
        lineId: user.lineId,
        name: user.name,
        pictureUrl: user.pictureUrl,
        role: user.role,
    }
})
