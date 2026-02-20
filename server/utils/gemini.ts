// server/utils/gemini.ts
// Gemini AI utilities for TypeScript

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

// Safety settings
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
]

// Chat history type
export interface ChatMessage {
    role: 'user' | 'model'
    parts: { text: string }[]
}

/**
 * Chat with Gemini AI
 */
export const chat = async (cacheChatHistory: ChatMessage[], prompt: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

        const chatHistory: ChatMessage[] = [
            {
                role: 'user',
                parts: [{ text: 'สวัสดี คุณสามารถช่วยตอบคำถามของฉันจากบริบทที่เคยถามและอ้างอิงจากคำตอบที่คุณตอบไป เป็นภาษาไทยได้ไหม?' }]
            },
            {
                role: 'model',
                parts: [{ text: 'แน่นอน! ถามมาได้เลยครับ 😊' }]
            }
        ]

        if (cacheChatHistory.length > 0) {
            chatHistory.push(...cacheChatHistory)
        }

        const chatSession = model.startChat({
            history: chatHistory,
            safetySettings,
        })

        const result = await chatSession.sendMessage(prompt)
        console.log('✅ Gemini Chat successful')

        return result.response.text()
    } catch (error: any) {
        console.error('❌ Error in Gemini chat:', error.message)
        throw error
    }
}



/**
 * Multimodal - process image with text
 */
export const multimodal = async (prompt: string, base64Image: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

        const imageParts = [{
            inlineData: {
                data: base64Image,
                mimeType: 'image/png'
            }
        }]

        const thaiPrompt = `${prompt}\n\nโปรดตอบกลับเป็นภาษาไทยทั้งหมด`

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    { text: thaiPrompt },
                    ...imageParts
                ]
            }],
            safetySettings,
        })

        console.log('✅ Gemini Multimodal successful')
        return result.response.text()
    } catch (error: any) {
        console.error('❌ Error in Gemini multimodal:', error.message)
        throw error
    }
}
