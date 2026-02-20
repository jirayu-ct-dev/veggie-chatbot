// server/utils/gemini-functions.ts
// Gemini Function Calling — ดึงข้อมูลสินค้าผัก/ผลไม้จาก DB

import {
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory,
    SchemaType,
    type FunctionDeclaration,
    type FunctionDeclarationsTool,
    type Content,
} from '@google/generative-ai'
import { prisma } from './db'

// ===== Config =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
]

// ===== Function Declarations =====

const searchProductsDeclaration: FunctionDeclaration = {
    name: 'search_products',
    description: 'ค้นหาสินค้าผัก/ผลไม้ตามชื่อ หรือคำค้นหา เช่น "กะหล่ำปลี", "แอปเปิ้ล", "ผักบุ้ง"',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            query: {
                type: SchemaType.STRING,
                description: 'คำค้นหาชื่อสินค้า',
            },
        },
        required: ['query'],
    },
}

const getProductsByCategoryDeclaration: FunctionDeclaration = {
    name: 'get_products_by_category',
    description: 'ดึงรายการสินค้าตามประเภท ได้แก่ VEGETABLE (ผัก), FRUIT (ผลไม้), OTHER (อื่นๆ)',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            category: {
                type: SchemaType.STRING,
                description: 'ประเภทสินค้า: VEGETABLE, FRUIT, หรือ OTHER',
            },
        },
        required: ['category'],
    },
}

const getProductDetailDeclaration: FunctionDeclaration = {
    name: 'get_product_detail',
    description: 'ดึงรายละเอียดสินค้าผัก/ผลไม้ตามชื่อ เช่น ราคา, จำนวนคงเหลือ, รายละเอียด',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            name: {
                type: SchemaType.STRING,
                description: 'ชื่อสินค้าที่ต้องการดูรายละเอียด',
            },
        },
        required: ['name'],
    },
}

const getAllProductsDeclaration: FunctionDeclaration = {
    name: 'get_all_products',
    description: 'ดึงรายการสินค้าทั้งหมดที่มีในร้าน พร้อมราคาและสถานะสต็อก',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {},
    },
}

const checkStockDeclaration: FunctionDeclaration = {
    name: 'check_stock',
    description: 'ตรวจสอบสต็อกสินค้า ว่ามีของพร้อมขายหรือไม่ และเหลือจำนวนเท่าไหร่',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            name: {
                type: SchemaType.STRING,
                description: 'ชื่อสินค้าที่ต้องการเช็คสต็อก',
            },
        },
        required: ['name'],
    },
}

// รวม tool declarations
const tools: FunctionDeclarationsTool[] = [
    {
        functionDeclarations: [
            searchProductsDeclaration,
            getProductsByCategoryDeclaration,
            getProductDetailDeclaration,
            getAllProductsDeclaration,
            checkStockDeclaration,
        ],
    },
]

// ===== Function Handlers =====

async function handleSearchProducts(args: { query: string }): Promise<string> {
    const products = await prisma.product.findMany({
        where: {
            name: { contains: args.query, mode: 'insensitive' },
        },
        select: {
            name: true,
            price: true,
            unit: true,
            category: true,
            inStock: true,
            stockQty: true,
            description: true,
        },
    })

    if (products.length === 0) {
        return JSON.stringify({ message: `ไม่พบสินค้าที่ชื่อ "${args.query}"`, products: [] })
    }

    return JSON.stringify({
        message: `พบสินค้า ${products.length} รายการ`,
        products: products.map(p => ({
            ชื่อ: p.name,
            ราคา: `${p.price} บาท/${p.unit}`,
            ประเภท: p.category === 'VEGETABLE' ? 'ผัก' : p.category === 'FRUIT' ? 'ผลไม้' : 'อื่นๆ',
            สถานะ: p.inStock ? `มีสินค้า (เหลือ ${p.stockQty} ${p.unit})` : 'สินค้าหมด',
            รายละเอียด: p.description || 'ไม่มีรายละเอียด',
        })),
    })
}

async function handleGetProductsByCategory(args: { category: string }): Promise<string> {
    const products = await prisma.product.findMany({
        where: { category: args.category as any },
        select: {
            name: true,
            price: true,
            unit: true,
            inStock: true,
            stockQty: true,
        },
        orderBy: { name: 'asc' },
    })

    const categoryLabel = args.category === 'VEGETABLE' ? 'ผัก' : args.category === 'FRUIT' ? 'ผลไม้' : 'อื่นๆ'

    if (products.length === 0) {
        return JSON.stringify({ message: `ไม่มีสินค้าประเภท${categoryLabel}ในร้าน`, products: [] })
    }

    return JSON.stringify({
        message: `สินค้าประเภท${categoryLabel} มี ${products.length} รายการ`,
        products: products.map(p => ({
            ชื่อ: p.name,
            ราคา: `${p.price} บาท/${p.unit}`,
            สถานะ: p.inStock ? `มีสินค้า (เหลือ ${p.stockQty} ${p.unit})` : 'สินค้าหมด',
        })),
    })
}

async function handleGetProductDetail(args: { name: string }): Promise<string> {
    const product = await prisma.product.findFirst({
        where: { name: { contains: args.name, mode: 'insensitive' } },
    })

    if (!product) {
        return JSON.stringify({ message: `ไม่พบสินค้าชื่อ "${args.name}"` })
    }

    return JSON.stringify({
        ชื่อ: product.name,
        รายละเอียด: product.description || 'ไม่มีรายละเอียด',
        ราคา: `${product.price} บาท/${product.unit}`,
        ประเภท: product.category === 'VEGETABLE' ? 'ผัก' : product.category === 'FRUIT' ? 'ผลไม้' : 'อื่นๆ',
        สถานะ: product.inStock ? 'มีสินค้า' : 'สินค้าหมด',
        จำนวนคงเหลือ: `${product.stockQty} ${product.unit}`,
    })
}

async function handleGetAllProducts(): Promise<string> {
    const products = await prisma.product.findMany({
        select: {
            name: true,
            price: true,
            unit: true,
            category: true,
            inStock: true,
            stockQty: true,
        },
        orderBy: { category: 'asc' },
    })

    if (products.length === 0) {
        return JSON.stringify({ message: 'ยังไม่มีสินค้าในร้าน', products: [] })
    }

    const vegetables = products.filter(p => p.category === 'VEGETABLE')
    const fruits = products.filter(p => p.category === 'FRUIT')
    const others = products.filter(p => p.category === 'OTHER')

    const format = (list: typeof products) =>
        list.map(p => ({
            ชื่อ: p.name,
            ราคา: `${p.price} บาท/${p.unit}`,
            สถานะ: p.inStock ? `มีสินค้า (เหลือ ${p.stockQty} ${p.unit})` : 'สินค้าหมด',
        }))

    return JSON.stringify({
        message: `มีสินค้าทั้งหมด ${products.length} รายการ`,
        ผัก: format(vegetables),
        ผลไม้: format(fruits),
        อื่นๆ: format(others),
    })
}

async function handleCheckStock(args: { name: string }): Promise<string> {
    const product = await prisma.product.findFirst({
        where: { name: { contains: args.name, mode: 'insensitive' } },
        select: { name: true, inStock: true, stockQty: true, unit: true, price: true },
    })

    if (!product) {
        return JSON.stringify({ message: `ไม่พบสินค้าชื่อ "${args.name}"` })
    }

    return JSON.stringify({
        ชื่อ: product.name,
        มีสินค้า: product.inStock,
        จำนวนคงเหลือ: `${product.stockQty} ${product.unit}`,
        ราคา: `${product.price} บาท/${product.unit}`,
    })
}

// ===== Dispatch function calls =====
async function executeFunctionCall(name: string, args: any): Promise<string> {
    switch (name) {
        case 'search_products':
            return handleSearchProducts(args)
        case 'get_products_by_category':
            return handleGetProductsByCategory(args)
        case 'get_product_detail':
            return handleGetProductDetail(args)
        case 'get_all_products':
            return handleGetAllProducts()
        case 'check_stock':
            return handleCheckStock(args)
        default:
            return JSON.stringify({ error: `ไม่รู้จัก function: ${name}` })
    }
}

// ===== Chat history type =====
export interface FunctionChatMessage {
    role: 'user' | 'model'
    parts: { text: string }[]
}

// ===== System instruction =====
const SYSTEM_INSTRUCTION = `คุณคือ "น้องผัก" 🌿 ผู้ช่วยอัจฉริยะประจำร้านผักผลไม้สด
คุณมีความสามารถในการค้นหาข้อมูลสินค้าจากฐานข้อมูลของร้านได้

หน้าที่ของคุณ:
- ตอบคำถามเกี่ยวกับสินค้าผัก/ผลไม้ในร้าน เช่น ราคา, สถานะสินค้า, จำนวนคงเหลือ
- แนะนำสินค้าตามความต้องการของลูกค้า
- ให้ข้อมูลเกี่ยวกับประโยชน์ของผัก/ผลไม้
- ใช้ Function Calling เพื่อดึงข้อมูลจริงจากฐานข้อมูลเสมอ อย่าเดาข้อมูล

กฎ:
- ตอบเป็นภาษาไทยเสมอ
- ใช้อิโมจิให้เหมาะสม ไม่มากเกินไป
- ถ้าลูกค้าถามราคาหรือสินค้า ให้เรียกใช้ function เพื่อดึงข้อมูลจริง
- ถ้าสินค้าหมด ให้แจ้งลูกค้าอย่างสุภาพ
- ตอบกระชับ ไม่ยาวเกินไป เหมาะกับการอ่านบน LINE`

// ===== Main: Chat with Function Calling =====
export const chatWithFunctions = async (
    chatHistory: FunctionChatMessage[],
    userMessage: string
): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: SYSTEM_INSTRUCTION,
            tools,
            safetySettings,
        })

        // สร้าง history สำหรับ chat
        const history: Content[] = chatHistory.map(msg => ({
            role: msg.role,
            parts: msg.parts,
        }))

        const chat = model.startChat({ history })

        // ส่งข้อความ user
        let result = await chat.sendMessage(userMessage)
        let response = result.response

        // วนลูป Function Calling จนกว่าจะได้คำตอบสุดท้าย
        const MAX_ITERATIONS = 5
        let iterations = 0

        while (iterations < MAX_ITERATIONS) {
            const candidate = response.candidates?.[0]
            if (!candidate) break

            const parts = candidate.content?.parts
            if (!parts) break

            // เช็คว่ามี function call หรือไม่
            const functionCallPart = parts.find(p => 'functionCall' in p)
            if (!functionCallPart || !('functionCall' in functionCallPart)) {
                // ไม่มี function call → จบลูป ได้คำตอบข้อความแล้ว
                break
            }

            const functionCall = (functionCallPart as any).functionCall
            const functionName = functionCall!.name
            const functionArgs = functionCall!.args

            console.log(`🔧 Function Call: ${functionName}`, JSON.stringify(functionArgs))

            // เรียก function จริง
            const functionResult = await executeFunctionCall(functionName, functionArgs)

            console.log(`✅ Function Result: ${functionResult.substring(0, 200)}...`)

            // ส่งผลลัพธ์กลับให้ Gemini
            result = await chat.sendMessage([
                {
                    functionResponse: {
                        name: functionName,
                        response: JSON.parse(functionResult),
                    },
                },
            ])
            response = result.response
            iterations++
        }

        const textResponse = response.text()
        console.log('✅ Gemini Function Calling chat successful')
        return textResponse
    } catch (error: any) {
        console.error('❌ Error in Gemini Function Calling chat:', error.message)
        throw error
    }
}
