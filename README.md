# 🥬 Veggie Chatbot

ระบบจัดการข้อมูลผัก & ผลไม้ สำหรับ AI Chatbot — สร้างด้วย **Nuxt 4**, **Prisma (PostgreSQL)** และ **TailwindCSS**

---

## 📁 โครงสร้างโปรเจค

```
veggie-chatbot/
├── app/
│   ├── pages/
│   │   ├── index.vue                   # หน้าหลัก — แสดงรายการผัก/ผลไม้
│   │   └── products/
│   │       ├── add.vue                 # หน้าเพิ่มสินค้า
│   │       └── [id].vue                # หน้าแก้ไขสินค้า
│   ├── assets/css/main.css             # TailwindCSS
│   ├── generated/prisma/               # Prisma Client (auto-generated)
│   └── app.vue                         # Root layout
├── server/
│   ├── api/
│   │   ├── products/
│   │   │   ├── index.get.ts            # GET    /api/products       — ดึงรายการสินค้า
│   │   │   ├── index.post.ts           # POST   /api/products       — เพิ่มสินค้า
│   │   │   ├── [id].get.ts             # GET    /api/products/:id   — ดึงสินค้าตาม ID
│   │   │   ├── [id].put.ts             # PUT    /api/products/:id   — แก้ไขสินค้า
│   │   │   └── [id].delete.ts          # DELETE /api/products/:id   — ลบสินค้า
│   │   └── upload.post.ts              # POST   /api/upload         — อัปโหลดรูปภาพ
│   └── utils/
│       └── db.ts                       # Prisma Client singleton
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── migrations/                     # Migration files
├── public/
│   └── uploads/                        # รูปภาพที่อัปโหลด (gitignored)
├── nuxt.config.ts
├── prisma.config.ts
├── package.json
├── .env.example
└── .env                                # ⚠️ ไม่ track ใน git
```

---

## 🚀 วิธีติดตั้ง (เมื่อ Clone ไปเครื่องใหม่)

### 1. ติดตั้ง Prerequisites

ต้องมีสิ่งเหล่านี้ในเครื่องก่อน:

- **Node.js** v18 ขึ้นไป — [ดาวน์โหลด](https://nodejs.org/)
- **PostgreSQL** — [ดาวน์โหลด](https://www.postgresql.org/download/)

### 2. Clone โปรเจค

```bash
git clone https://github.com/your-username/veggie-chatbot.git
cd veggie-chatbot
```

### 3. ติดตั้ง Dependencies

```bash
npm install
```

### 4. ตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.example` ไปเป็น `.env` แล้วแก้ไขค่าให้ตรงกับ Database ในเครื่อง:

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
DATABASE_URL="postgresql://postgres:รหัสผ่าน@localhost:5432/veggie-chatbot?schema=public"
```

> **💡 หมายเหตุ:** ต้องสร้าง Database ชื่อ `veggie-chatbot` ใน PostgreSQL ก่อน
>
> ```sql
> CREATE DATABASE "veggie-chatbot";
> ```

### 5. รัน Database Migration

```bash
npx prisma migrate dev
```

คำสั่งนี้จะ:
- สร้าง tables ใน Database ตาม `prisma/schema.prisma`
- Generate Prisma Client ไปที่ `app/generated/prisma/`

### 6. เริ่ม Development Server

```bash
npx nuxt dev
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:3000** 🎉

---

## 📦 คำสั่งที่ใช้บ่อย

| คำสั่ง | คำอธิบาย |
|--------|----------|
| `npx nuxt dev` | เริ่ม dev server |
| `npx nuxt build` | Build สำหรับ production |
| `npx nuxt preview` | Preview production build |
| `npx prisma migrate dev` | รัน migration (หลังแก้ schema) |
| `npx prisma studio` | เปิด Prisma Studio (ดูข้อมูลใน DB) |
| `npx prisma generate` | Generate Prisma Client |

---

## 🔗 API Endpoints

### Products (ผัก/ผลไม้)

| Method | Endpoint | คำอธิบาย | Body |
|--------|----------|----------|------|
| `GET` | `/api/products` | ดึงรายการสินค้า | Query: `?search=ผัก&category=VEGETABLE` |
| `POST` | `/api/products` | เพิ่มสินค้าใหม่ | `{ name, price, unit, category, ... }` |
| `GET` | `/api/products/:id` | ดึงสินค้าตาม ID | — |
| `PUT` | `/api/products/:id` | แก้ไขสินค้า | `{ name?, price?, unit?, ... }` |
| `DELETE` | `/api/products/:id` | ลบสินค้า | — |

### Upload

| Method | Endpoint | คำอธิบาย | Body |
|--------|----------|----------|------|
| `POST` | `/api/upload` | อัปโหลดรูปภาพ | `FormData { image: File }` |

### Category Enum

| ค่า | ความหมาย |
|-----|----------|
| `VEGETABLE` | ผัก |
| `FRUIT` | ผลไม้ |
| `OTHER` | อื่นๆ |

---

## 🤖 ตัวอย่าง Prompt สำหรับ AI ช่วยสร้างระบบจัดการข้อมูล

ด้านล่างนี้คือตัวอย่าง prompt ที่ใช้สั่ง AI สร้างหน้าเว็บ + API CRUD สำหรับจัดการผัก/ผลไม้ในโปรเจคนี้:

---

### ✅ Prompt 1: สร้างหน้าเว็บ + API CRUD เต็มรูปแบบ

```
สร้างหน้าจัดการข้อมูลผัก/ผลไม้ โดยมีฟีเจอร์ดังนี้:

1. หน้าแสดงรายการสินค้า (index.vue)
   - แสดงสินค้าเป็น card grid
   - ค้นหาด้วยชื่อ
   - กรองตามประเภท (ผัก, ผลไม้, อื่นๆ)
   - ปุ่มแก้ไข และ ลบ (มี modal ยืนยัน)

2. หน้าเพิ่มสินค้า (products/add.vue)
   - อัปโหลดรูปภาพจากเครื่อง (drag & drop หรือ click)
   - กรอก ชื่อ, รายละเอียด, ประเภท, ราคา, หน่วย, จำนวนสต็อก
   - toggle สถานะ มีสินค้า/หมด

3. หน้าแก้ไขสินค้า (products/[id].vue)
   - โหลดข้อมูลเดิมมากรอกในฟอร์ม
   - เปลี่ยนรูปภาพได้

4. API (server/api/products/)
   - GET    /api/products       — ดึงรายการ (search, category filter)
   - POST   /api/products       — เพิ่มสินค้า
   - GET    /api/products/:id   — ดึงสินค้าตาม ID
   - PUT    /api/products/:id   — แก้ไขสินค้า
   - DELETE /api/products/:id   — ลบสินค้า + ลบรูปภาพ
   - POST   /api/upload         — อัปโหลดรูปภาพ เก็บที่ public/uploads/

ใช้ Prisma กับ PostgreSQL, ออกแบบด้วย TailwindCSS ให้สวยงาม
```

---

### ✅ Prompt 2: สร้างเฉพาะ API CRUD

```
สร้าง API สำหรับ CRUD ผัก/ผลไม้ ใน server/api/products/ โดยใช้ Prisma:

- GET    /api/products       — ดึงรายการ รองรับ query: search (ค้นหาชื่อ), category (กรองประเภท)
- POST   /api/products       — เพิ่มสินค้า ต้อง validate: name, price, unit, category
- GET    /api/products/:id   — ดึงข้อมูลสินค้า 1 รายการ
- PUT    /api/products/:id   — แก้ไข อัปเดตเฉพาะ field ที่ส่งมา
- DELETE /api/products/:id   — ลบสินค้า รวมถึงลบไฟล์รูปภาพ

โดย Product model ใน Prisma มี field: name, description, price, unit, category (VEGETABLE/FRUIT/OTHER), inStock, stockQty, imageUrl
```

---

### ✅ Prompt 3: สร้างเฉพาะหน้าฟอร์มเพิ่มข้อมูล

```
สร้างหน้าเพิ่มข้อมูลผัก/ผลไม้ ที่ pages/products/add.vue:

- อัปโหลดรูปภาพจากเครื่อง (ลากวางได้, คลิกเลือกได้)
- เลือกประเภท: ผัก / ผลไม้ / อื่นๆ (แบบ radio card)
- กรอก: ชื่อ, รายละเอียด, ราคา, หน่วย (dropdown), จำนวนสต็อก
- toggle สถานะ มีสินค้า/หมด
- เมื่อกดบันทึก ให้ upload รูปก่อน แล้วค่อย POST ข้อมูลสินค้า
- มี toast notification แจ้งสถานะ

ออกแบบด้วย TailwindCSS ให้สวยงาม มี gradient, rounded corners, hover effects
```

---

### ✅ Prompt 4: เพิ่ม Model ใหม่ใน Schema + CRUD ทั้งระบบ

```
เพิ่ม model "Order" ใน prisma/schema.prisma สำหรับเก็บข้อมูลคำสั่งซื้อ:
- id, customerName, customerPhone, items (Json), totalAmount, status (PENDING/CONFIRMED/COMPLETED/CANCELLED), createdAt, updatedAt

จากนั้นสร้าง:
1. Migration ด้วย prisma migrate dev
2. API CRUD ที่ server/api/orders/
3. หน้าแสดงรายการคำสั่งซื้อ + หน้าเพิ่มคำสั่งซื้อ

ออกแบบด้วย TailwindCSS
```

---

## 📝 Database Schema

```prisma
enum Category {
  VEGETABLE // ผัก
  FRUIT     // ผลไม้
  OTHER     // อื่นๆ
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?  // รายละเอียดสำหรับ AI chatbot
  price       Float    // ราคา
  unit        String   // หน่วยขาย เช่น "กิโลกรัม", "กำ"
  category    Category // ประเภท
  inStock     Boolean  @default(true)
  stockQty    Float    @default(0)
  imageUrl    String?  // path รูปภาพ
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 🛠 Tech Stack

| เทคโนโลยี | เวอร์ชัน | ใช้ทำอะไร |
|-----------|---------|----------|
| **Nuxt** | 4.3 | Full-stack Vue framework |
| **Vue** | 3.5 | Frontend framework |
| **TailwindCSS** | 4 | CSS utility framework |
| **Prisma** | 7 | ORM สำหรับ PostgreSQL |
| **PostgreSQL** | — | ฐานข้อมูล |
