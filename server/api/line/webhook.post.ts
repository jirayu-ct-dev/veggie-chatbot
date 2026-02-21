// server/api/line/webhook.post.ts
// LINE Webhook API for Veggie Chatbot with Gemini Function Calling

import {
    replyMessage,
    isAnimationLoading,
    type LineMessage,
} from '../../utils/line'
import { chatWithFunctionCalling } from '../../utils/gemini'

// ===== Chat History Cache (per user) =====
const userChatHistory = new Map<string, { role: string; text: string }[]>()
const MAX_HISTORY_LENGTH = 10

// ===== LINE Event Types =====
interface LineSource {
    type: 'user' | 'group' | 'room'
    userId?: string
    groupId?: string
    roomId?: string
}

interface LineTextMessage {
    type: 'text'
    id: string
    text: string
}

interface LineImageMessage {
    type: 'image'
    id: string
}

type WebhookMessage = LineTextMessage | LineImageMessage

interface LineMessageEvent {
    type: 'message'
    message: WebhookMessage
    timestamp: number
    source: LineSource
    replyToken: string
    mode: string
    webhookEventId: string
}

interface LineFollowEvent {
    type: 'follow' | 'unfollow'
    timestamp: number
    source: LineSource
    replyToken?: string
    mode: string
    webhookEventId: string
}

type LineEvent = LineMessageEvent | LineFollowEvent

interface LineWebhookBody {
    destination: string
    events: LineEvent[]
}

// ===== Handle Follow Event =====
const handleFollow = async (replyToken: string) => {
    const welcomeMessage = `🎉 ยินดีต้อนรับสู่ Veggie Shop!\n\n🥬🍎 เราจำหน่ายผักและผลไม้สดใหม่ คุณภาพดีทุกวัน\n\n💬 ถามอะไรก็ได้ เช่น:\n• "มีผักอะไรบ้าง"\n• "แอปเปิ้ลราคาเท่าไหร่"\n• "แนะนำผลไม้หน่อย"\n\nขอบคุณที่ติดตามครับ! 🙏`

    await replyMessage(replyToken, [
        { type: 'text', text: welcomeMessage },
    ])
}

// ===== Main Webhook Handler =====
export default defineEventHandler(async (event) => {
    // ===== Debug: ตรวจสอบว่า request ถึง handler หรือไม่ =====
    console.log('🚀 Webhook handler called!')
    console.log('📌 Method:', event.method)
    console.log('📌 URL:', getRequestURL(event).pathname)

    try {
        const body = await readBody<LineWebhookBody>(event)

        console.log('📨 Webhook received:', JSON.stringify(body, null, 2))

        // Process each event
        for (const lineEvent of body.events) {
            console.log(`🔔 Event type: ${lineEvent.type}`)

            // ===== Handle Follow Event =====
            if (lineEvent.type === 'follow' && lineEvent.replyToken) {
                await handleFollow(lineEvent.replyToken)
                continue
            }

            // ===== Handle Unfollow Event =====
            if (lineEvent.type === 'unfollow') {
                const userId = lineEvent.source.userId
                if (userId) {
                    userChatHistory.delete(userId)
                }
                console.log(`👋 User unfollowed: ${userId}`)
                continue
            }

            // ===== Handle Text Message =====
            if (lineEvent.type === 'message' && lineEvent.message.type === 'text') {
                const userMessage = lineEvent.message.text
                const userId = lineEvent.source.userId || 'unknown'
                const replyToken = lineEvent.replyToken

                console.log(`💬 Message from ${userId}: ${userMessage}`)

                // Show loading animation
                if (userId !== 'unknown') {
                    await isAnimationLoading(userId, 30)
                }

                try {
                    // เรียก Gemini พร้อม Function Calling
                    const botReply = await chatWithFunctionCalling(userMessage)
                    console.log(`🤖 Bot: ${botReply}`)

                    // ส่งข้อความตอบกลับผ่าน Line
                    await replyMessage(replyToken, [
                        { type: 'text', text: botReply },
                    ])
                } catch (error: any) {
                    console.error('❌ Error processing message:', error.message)

                    // Fallback response
                    await replyMessage(replyToken, [
                        { type: 'text', text: 'ขออภัยครับ ระบบขัดข้อง กรุณาลองใหม่อีกครั้งนะครับ 🙏' },
                    ])
                }
            }
        }

        return { success: true }
    } catch (error: any) {
        console.error('❌ Webhook error:', error)
        return { success: false, error: error.message }
    }
})
