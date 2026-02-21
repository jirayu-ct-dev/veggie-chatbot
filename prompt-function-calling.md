### 1. Concept การทำงาน
1. **User ส่งข้อความ:** "ขอดูรายการผักหน่อย" หรือ "แอปเปิ้ลราคาเท่าไหร่"
2. **Gemini วิเคราะห์:** ตรวจพบว่าต้องใช้ข้อมูลสินค้า จึงเรียก Function `searchProducts`.
3. **Nuxt Backend:** ไปดึงข้อมูลจาก Database/API ตามเงื่อนไขที่ AI ส่งมา
4. **Gemini ประมวลผล:** นำข้อมูลสินค้าที่ได้มาเขียนคำตอบที่ดูเป็นธรรมชาติ
5. **Line Bot:** ส่งข้อความกลับ (อาจจะส่งเป็น Text หรือ Flex Message)

---

### 2. Prompt สำหรับให้ AI (เช่น ChatGPT/Claude) เขียน Code ให้

> **Prompt:**
> "ช่วยเขียนโค้ด Nuxt 3 (server route) โดยใช้ library `@google/generative-ai` เพื่อทำ Function Calling ร่วมกับ Gemini API สำหรับ Line Chatbot (Antigravity framework) 
> 
> **เงื่อนไข:**
> 1. สร้าง Function ชื่อ `get_products` สำหรับดึงข้อมูลสินค้า
> 2. Parameter ของฟังก์ชันประกอบด้วย `query` (string - ชื่อสินค้า) และ `category` (string - ประเภทสินค้า)
> 3. Schema ของ Product คือ: { id, name, description, price, unit, category, inStock, stockQty, imageUrl }
> 4. เมื่อ AI ได้ข้อมูลสินค้ามาแล้ว ให้ตอบกลับเป็นภาษาไทยที่สุภาพ
> 5. หากสินค้ามีรูปภาพ (imageUrl) ให้แสดงผลเป็น Line Flex Message หรือ Buttons Template (ถ้าเป็นไปได้)
> 6. เขียนส่วนของ Logic การดึงข้อมูลจำลอง (Mock API) หรือดึงผ่าน Prisma ตาม Schema ที่ให้มา"

---

### 3. ตัวอย่างการ Implement ใน Nuxt (Server Side)

ไฟล์: `server/utils/gemini.ts` (หรือรวมไว้ใน webhook)

```typescript
import { GoogleGenerativeAI, FunctionDeclarationSchemaType } from "@google/generative-ai";

// 1. กำหนด Tools (Function Calling)
export const productTools = {
  functionDeclarations: [
    {
      name: "get_products",
      description: "ดึงข้อมูลสินค้าจากระบบ เช่น ชื่อสินค้า ราคา สต็อก และรายละเอียด",
      parameters: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
          query: {
            type: FunctionDeclarationSchemaType.STRING,
            description: "ชื่อสินค้าที่ลูกค้าต้องการค้นหา เช่น 'กล้วย', 'ผักกาด'",
          },
          category: {
            type: FunctionDeclarationSchemaType.STRING,
            description: "หมวดหมู่สินค้า เช่น 'VEGETABLE', 'FRUIT'",
          }
        },
      },
    },
  ],
};

// 2. ฟังก์ชันจริงที่ไปดึง DB (ตัวอย่างใช้ Prisma)
export async function get_products(args: { query?: string; category?: string }) {
  // สมมติว่าใช้ Prisma ในการดึงข้อมูล
  // const products = await prisma.product.findMany({ where: ... })
  
  // ตัวอย่างข้อมูลจำลอง
  return [
    {
      id: 1,
      name: "แอปเปิ้ลฟูจิ",
      price: 35,
      unit: "ลูก",
      category: "FRUIT",
      inStock: true,
      imageUrl: "https://example.com/apple.jpg",
      description: "หวาน กรอบ อร่อย"
    }
  ];
}
```

---

### 4. ตัวอย่างการใช้งานใน Antigravity Webhook

ไฟล์: `server/api/line/webhook.post.ts` (หรือตำแหน่งที่คุณจัดการ Line Event)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { productTools, get_products } from "../../utils/gemini";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  tools: productTools as any,
});

export default defineEventHandler(async (event) => {
  // ... รับ Event จาก Line (Antigravity logic)
  const userText = "มีแอปเปิ้ลไหมครับ?"; 

  const chat = model.startChat();
  const result = await chat.sendMessage(userText);
  const response = result.response;
  const call = response.functionCalls()?.[0];

  if (call) {
    if (call.name === "get_products") {
      // 1. เรียกฟังก์ชันดึงข้อมูลจริง
      const apiData = await get_products(call.args as any);
      
      // 2. ส่งข้อมูลกลับไปให้ Gemini เพื่อให้สรุปคำพูด
      const result2 = await chat.sendMessage([{
        functionResponse: {
          name: "get_products",
          response: { content: apiData }
        }
      }]);

      const finalBotText = result2.response.text();
      
      // 3. ตอบกลับ Line (ใช้ Antigravity client.replyMessage)
      // คุณสามารถเพิ่ม Logic ตรวจสอบว่าถ้ามี apiData ให้ส่ง Flex Message ต่อท้ายได้
      console.log("Gemini ตอบ:", finalBotText);
    }
  } else {
    // ตอบกลับธรรมดาถ้าไม่มีการเรียกฟังก์ชัน
    console.log(response.text());
  }
});
```

### 5. คำแนะนำเพิ่มเติมสำหรับการแสดงผลบน Line

เพื่อให้แชทบอทดูเป็นมืออาชีพ เมื่อ Gemini ตรวจพบสินค้า คุณควรทำ **Flex Message Builder**:

*   **Text Response:** ให้ Gemini สรุปคำตอบ เช่น "มีครับ! แอปเปิ้ลฟูจิราคาลูกละ 35 บาท ตอนนี้มีของพร้อมส่งครับ"
*   **Flex Message:** วนลูปข้อมูล `apiData` ที่ได้มา สร้างเป็น `Carousel` แสดงรูปภาพ (`imageUrl`), ชื่อ (`name`), และราคา (`price`) พร้อมปุ่ม "หยิบใส่ตะกร้า"

**เทคนิคเด็ด:** คุณสามารถใส่ `description` ใน Product Model ไปให้ Gemini เยอะๆ เพื่อให้มันช่วยขายของได้ เช่น "แอปเปิ้ลนี้อุดมไปด้วยวิตามิน C ช่วยบำรุงผิวพรรณ" ซึ่ง AI จะดึงข้อมูลนี้มาตอบลูกค้าเองโดยที่เราไม่ต้องเขียน Code เพิ่มครับ