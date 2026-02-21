// server/utils/gemini.ts
// Gemini AI utilities with Function Calling for Veggie Chatbot

import { GoogleGenerativeAI, SchemaType, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'
import type { FunctionDeclarationsTool } from '@google/generative-ai'
import { prisma } from './db'

// ===== Config =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

// ===== Safety Settings =====
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

// ===== 1. Function Calling Tools =====
export const productTools: FunctionDeclarationsTool[] = [
    {
        functionDeclarations: [
            {
                name: 'get_products',
                description: 'ดึงข้อมูลสินค้า (ผัก/ผลไม้) จากระบบ เช่น ชื่อสินค้า ราคา สต็อก และรายละเอียด ใช้เมื่อลูกค้าถามเกี่ยวกับสินค้า ราคา หรือสต็อก',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        query: {
                            type: SchemaType.STRING,
                            description: "ชื่อสินค้าที่ลูกค้าต้องการค้นหา เช่น 'กล้วย', 'ผักกาด', 'แอปเปิ้ล'",
                        },
                        category: {
                            type: SchemaType.STRING,
                            description: "หมวดหมู่สินค้า: 'VEGETABLE' (ผัก), 'FRUIT' (ผลไม้), 'OTHER' (อื่นๆ) — ส่งเฉพาะเมื่อลูกค้าระบุหมวดหมู่ชัดเจน",
                        },
                    },
                },
            },
        ],
    },
]

// ===== 2. ฟังก์ชันดึงข้อมูลจาก Database (Prisma) =====
export async function getProducts(args: { query?: string; category?: string }) {
    const where: any = {}

    if (args.query) {
        where.name = {
            contains: args.query,
            mode: 'insensitive',
        }
    }

    if (args.category) {
        where.category = args.category
    }

    const products = await prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    })

    return products
}

// ===== 3. Map ชื่อ Function → ฟังก์ชันจริง =====
const functionHandlers: Record<string, (args: any) => Promise<any>> = {
    get_products: getProducts,
}

// ===== 4. Chat with Function Calling =====
export const chatWithFunctionCalling = async (userMessage: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            tools: productTools,
            safetySettings,
            systemInstruction: `
                คุณคือผู้ช่วยขายผักและผลไม้ของร้าน "Veggie Shop" 🥬🍎
                
                หน้าที่ของคุณ:
                1. ตอบคำถามเกี่ยวกับสินค้า ราคา และสต็อก
                2. แนะนำผักผลไม้ที่เหมาะสมกับลูกค้า
                3. ตอบด้วยความเป็นมิตร สุภาพ และใช้อิโมจิให้เหมาะสม
                4. ตอบเป็นภาษาไทยเสมอ
                5. ถ้าลูกค้าถามนอกเหนือจากผักผลไม้ ให้บอกว่าช่วยได้เฉพาะเรื่องสินค้าในร้าน
                6. ถ้าสินค้าหมด (inStock = false) ให้แจ้งลูกค้าว่าสินค้าหมดชั่วคราว
                7. ใช้ข้อมูล description ของสินค้าเพื่อช่วยแนะนำและขายของ

                กฎสำคัญ:
                - ตอบสั้นกระชับ ไม่เกิน 300 ตัวอักษร (เว้นแต่ต้องแสดงรายการสินค้า)
                - ใช้อิโมจิให้เหมาะสม เช่น 🥬 🍎 🥕 💰 ✅
                - ถ้าถามราคา ให้บอกราคาเป็นบาท (฿) พร้อมหน่วย
                - ถ้าถามสินค้าทั้งหมด ให้แสดงเป็นรายการ
            `,
        })

        const chat = model.startChat()
        const result = await chat.sendMessage(userMessage)
        const response = result.response
        const functionCalls = response.functionCalls()
        const call = functionCalls?.[0]

        if (call && functionHandlers[call.name]) {
            // 1. เรียกฟังก์ชันดึงข้อมูลจริงจาก DB
            console.log(`🔧 Function Call: ${call.name}`, call.args)
            const apiData = await functionHandlers[call.name]!(call.args)
            console.log(`📦 Function Result: ${apiData.length} items found`)

            // 2. ส่งข้อมูลกลับไปให้ Gemini เพื่อให้สรุปคำตอบ
            const result2 = await chat.sendMessage([{
                functionResponse: {
                    name: call.name,
                    response: { content: apiData },
                },
            }])

            return result2.response.text()
        }

        // ถ้าไม่มี Function Call → ตอบกลับธรรมดา
        return response.text()

    } catch (error: any) {
        console.error('❌ Error in Gemini Function Calling:', error.message)
        throw error
    }
}
