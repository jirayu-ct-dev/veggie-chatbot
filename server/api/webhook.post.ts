// server/api/webhook.post.ts
// LINE Webhook — รับข้อความจาก LINE แล้วตอบด้วย Gemini + Function Calling

import {
    verifySignature,
    replyMessage,
    isAnimationLoading,
    getImageBinary,
} from '../utils/line'
import { chatWithFunctions, type FunctionChatMessage } from '../utils/gemini-functions'
import { multimodal } from '../utils/gemini'

// ===== In-memory chat history (per user) =====
// Production ควรใช้ Redis หรือ DB แทน
const chatHistoryMap = new Map<string, FunctionChatMessage[]>()
const MAX_HISTORY = 20 // เก็บสูงสุด 20 messages ต่อ user

function getChatHistory(userId: string): FunctionChatMessage[] {
    return chatHistoryMap.get(userId) || []
}

function addToHistory(userId: string, role: 'user' | 'model', text: string) {
    const history = getChatHistory(userId)
    history.push({ role, parts: [{ text }] })

    // จำกัดจำนวน history
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY)
    }

    chatHistoryMap.set(userId, history)
}

// ===== Webhook handler =====
export default defineEventHandler(async (event) => {
    // 1) ดึง Signature ก่อน
    const signature = getHeader(event, 'x-line-signature')

    // 2) อ่าน Raw Body ตรงๆ จาก Node HTTP Request Stream
    const chunks: Buffer[] = []
    for await (const chunk of event.node.req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    const rawBodyBuffer = Buffer.concat(chunks)
    const rawBody = rawBodyBuffer.toString('utf-8')

    // 3) ตรวจสอบ Signature (ใช้ Buffer ดิบเท่านั้น)
    if (!signature || !verifySignature(signature, rawBodyBuffer)) {
        console.warn('⚠️ Invalid LINE signature. Expected signature mismatch.')
        throw createError({ statusCode: 403, statusMessage: 'Invalid signature' })
    }

    // แปลงกลับเป็น object หลังจาก verify ผ่านแล้ว
    let body: any = {}
    try {
        body = JSON.parse(rawBody)
    } catch {
        // หาก parse error จะเป็น empty object
    }

    // Process events
    const events = body.events || []

    for (const lineEvent of events) {
        try {
            await handleEvent(lineEvent)
        } catch (err: any) {
            console.error('❌ Error handling event:', err.message)
        }
    }

    return { status: 'ok' }
})

// ===== Event handler =====
async function handleEvent(event: any) {
    // รองรับเฉพาะ message event
    if (event.type !== 'message') return

    const userId = event.source?.userId
    const replyToken = event.replyToken
    const message = event.message

    if (!userId || !replyToken) return

    // แสดง loading animation
    isAnimationLoading(userId, 30)

    // จัดการตามประเภทข้อความ
    switch (message.type) {
        case 'text':
            await handleTextMessage(userId, replyToken, message.text)
            break

        case 'image':
            await handleImageMessage(userId, replyToken, message.id)
            break

        default:
            await replyMessage(replyToken, [
                {
                    type: 'text',
                    text: '🌿 สวัสดีค่ะ น้องผักรับเฉพาะข้อความและรูปภาพนะคะ\nลองพิมพ์ถามเกี่ยวกับสินค้าผัก/ผลไม้ได้เลยค่ะ!',
                },
            ])
    }
}

// ===== Handle text message =====
async function handleTextMessage(userId: string, replyToken: string, text: string) {
    try {
        // เก็บ history ของ user
        const history = getChatHistory(userId)

        // เรียก Gemini Function Calling
        const aiResponse = await chatWithFunctions(history, text)

        // บันทึก history
        addToHistory(userId, 'user', text)
        addToHistory(userId, 'model', aiResponse)

        // ตัดข้อความถ้ายาวเกินไป (LINE จำกัด 5000 ตัวอักษร)
        const maxLength = 4800
        const responseText = aiResponse.length > maxLength
            ? aiResponse.substring(0, maxLength) + '\n\n...ข้อความยาวเกินไป กรุณาถามเพิ่มเติมค่ะ 🙏'
            : aiResponse

        await replyMessage(replyToken, [
            { type: 'text', text: responseText },
        ])

        console.log(`💬 [${userId.substring(0, 8)}...] User: ${text.substring(0, 50)}`)
        console.log(`🤖 [${userId.substring(0, 8)}...] Bot: ${responseText.substring(0, 50)}`)
    } catch (error: any) {
        console.error('❌ Error in text handler:', error.message)
        await replyMessage(replyToken, [
            {
                type: 'text',
                text: '😅 ขออภัยค่ะ เกิดข้อผิดพลาด ลองถามใหม่อีกครั้งนะคะ',
            },
        ])
    }
}

// ===== Handle image message =====
async function handleImageMessage(userId: string, replyToken: string, messageId: string) {
    try {
        // ดึงรูปจาก LINE
        const imageBinary = await getImageBinary(messageId)

        if (!imageBinary) {
            await replyMessage(replyToken, [
                { type: 'text', text: '😅 ไม่สามารถรับรูปภาพได้ค่ะ ลองส่งใหม่อีกครั้งนะคะ' },
            ])
            return
        }

        // แปลง ArrayBuffer → Base64
        const base64Image = Buffer.from(imageBinary).toString('base64')

        // เรียก Gemini multimodal
        const prompt = `คุณคือ "น้องผัก" ผู้ช่วยร้านผักผลไม้
ดูรูปภาพนี้แล้วตอบคำถาม:
- ถ้าเป็นรูปผัก/ผลไม้ → บอกว่าเป็นอะไร ประโยชน์ วิธีเลือกซื้อ วิธีเก็บรักษา
- ถ้าเป็นรูปอื่นๆ → บอกว่าเห็นอะไรในรูป
ตอบกระชับ เหมาะกับ LINE`

        const aiResponse = await multimodal(prompt, base64Image)

        const maxLength = 4800
        const responseText = aiResponse.length > maxLength
            ? aiResponse.substring(0, maxLength) + '\n\n...ข้อความยาวเกินไป 🙏'
            : aiResponse

        // บันทึก history
        addToHistory(userId, 'user', '[ส่งรูปภาพ]')
        addToHistory(userId, 'model', responseText)

        await replyMessage(replyToken, [
            { type: 'text', text: responseText },
        ])

        console.log(`🖼️ [${userId.substring(0, 8)}...] Image processed`)
    } catch (error: any) {
        console.error('❌ Error in image handler:', error.message)
        await replyMessage(replyToken, [
            {
                type: 'text',
                text: '😅 ไม่สามารถวิเคราะห์รูปภาพได้ค่ะ ลองส่งใหม่อีกครั้งนะคะ',
            },
        ])
    }
}
