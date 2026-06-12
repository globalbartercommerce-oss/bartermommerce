# Initial Prompt for Coding Agents

โปรดอ่านไฟล์ทั้งหมดในโปรเจกต์ก่อนเริ่มกระบวนการพัฒนา (ได้แก่ `PROJECT.md`, `AI_RULES.md`, และ `SYSTEM_ARCHITECTURE.md`) รวมถึงศึกษาความสามารถจาก Local Skills ในโฟลเดอร์ `.agents/skills/`

---

## 🎭 Act As
สวมบทบาทเป็น **World-Class SaaS Engineering Team** (ทีมวิศวกรรมระดับโลกที่มีความเชี่ยวชาญการสร้างแพลตฟอร์มแบบ SaaS) เพื่อพัฒนาแอปพลิเคชัน **Unicorn Global Commerce Platform**

---

## 📋 Platform Requirements
ระบบต้องประกอบด้วย 10 ฟังก์ชันหลักดังนี้:
1. **Global Marketplace**: ตลาดกลางซื้อขายแลกเปลี่ยนสินค้าและบริการข้ามพรมแดน
2. **Merchant Directory**: สมุดรายนามและโปรไฟล์ธุรกิจของผู้ประกอบการ
3. **Business Networking**: ระบบสร้างความสัมพันธ์และเครือข่ายคู่ค้า B2B
4. **Wallet**: กระเป๋าเงินบันทึกประวัติการถือครองเครดิตและคะแนนระบบ
5. **Internal Currency**: ระบบธุรกรรมและบัญชีแยกประเภทเครดิตภายใน (Unicorn Credits)
6. **Barter Exchange**: ระบบจับคู่แลกเปลี่ยนตรงตัว (Bilateral) และแลกเปลี่ยนแบบกลุ่มพหุภาคี (Multi-lateral)
7. **Escrow**: ระบบล็อกคะแนนเครดิตค้ำประกันความเสี่ยงระหว่างคู่ค้า
8. **Settlement**: ระบบจ่ายเงินสดภายนอกข้ามชาติและการหักค่าธรรมเนียม
9. **AI Matching**: ระบบจับคู่ดีลแลกเปลี่ยนที่คุ้มค่าที่สุดผ่านเวกเตอร์และเงื่อนไขความต้องการ
10. **AI Assistant**: ผู้ช่วยธุรกิจส่วนตัวในการแชตและแปลภาษาพร้อมให้คำแนะนำการค้า

---

## 🛠️ Technology Stack
* **Frontend**: Remix + Tailwind CSS + Shadcn UI
* **Backend**: Cloudflare Workers (Edge Workers API)
* **Database & Storage**: Supabase Postgres (transaction-safe) + Cloudflare R2
* **AI/ML**: Cloudflare Workers AI

---

## 📝 Required Actions & Deliverables
* **Design Architecture**: ออกแบบโครงสร้างสถาปัตยกรรมระดับซอฟต์แวร์ (DDD & Clean Architecture)
* **Design Database**: ออกแบบตาราง ดัชนี (Indices) คีย์นอก และนโยบาย RLS ที่รัดกุม
* **Design API**: จัดทำข้อตกลงและสัญญาเชื่อมต่อข้อมูล (Type-Safe API Contracts)
* **Design UI**: พัฒนาหน้าจอระดับพรีเมียม ตอบสนองเร็ว และเข้าถึงง่าย (A11y)
* **Generate Production-Ready Code**: เขียนโค้ดที่มีความเสถียร มีคำอธิบาย และพร้อมใช้งานในระดับโปรดักชันจริง

---

## ⚠️ Implementation Rules & Scale Constraints
* **TypeScript Only**: บังคับพิมพ์ไทป์อย่างเข้มข้น ห้ามใช้ `any`
* **Strict Validation**: ใช้ Zod ในการรับ ตรวจสอบ และแลกเปลี่ยนข้อมูล
* **CSS & Component**: ใช้ Tailwind CSS ร่วมกับ Shadcn UI เท่านั้น
* **No Mock Architecture**: ห้ามทำระบบจำลอง (Mock) ข้อมูลธุรกรรมการเงินและการจัดเก็บข้อมูลหลัก ต้องเชื่อม Supabase และ R2 จริง
* **Enterprise-Grade Capacity**: ออกแบบโค้ด การค้นหา และการเขียนคิวรี ให้รองรับการทำงานในสเกล:
  * **100,000+ Users** (ผู้ใช้แสนรายขึ้นไป)
  * **10,000+ Merchants** (ร้านค้าหมื่นร้านค้าขึ้นไป)
  * **50+ Countries** (รองรับการค้ากว่า 50 ประเทศ)
* **Incremental Output**: ทยอยส่งมอบโค้ดทีละฟังก์ชันโดยรักษาความเสถียรและความสอดคล้องของโปรเจกต์ทั้งหมด (Maintain Project Consistency)
