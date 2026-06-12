# Unicorn Global Commerce Platform

## Company Information
* **Company**: Unicorn Global Commerce LLC
* **Headquarters**: California, USA
* **Thailand Partner**: Unicorn Global Link

---

## Mission
Build a global barter commerce ecosystem connecting Thai businesses, Asian entrepreneurs, and international trade networks.

---

## Platform Type
* **AI-Powered Global Barter Commerce Platform**

---

## Core Concepts
* **Marketplace**: ซื้อขายแลกเปลี่ยนสินค้าและบริการแบบดั้งเดิม
* **Barter Exchange**: การแลกเปลี่ยนสินค้าแบบไม่ใช้เงินตราข้ามเครือข่าย
* **Community Commerce**: คอมมูนิตี้การค้าร่วมกันระหว่างกลุ่มสมาคมและคู่ค้า
* **Business Directory**: สมุดรายนามธุรกิจและคู่ค้าระดับโลก
* **Wallet**: กระเป๋าเงินเก็บและบันทึกคะแนนเครดิตระบบ
* **Internal Currency**: สกุลเงินระบบสำหรับอำนวยความสะดวกในการแลกเปลี่ยน (Unicorn Credits)
* **AI Commerce**: ระบบจับคู่อัตโนมัติและการนำเสนอสินค้าผ่าน AI
* **Global Trade Network**: เครือข่ายเชื่อมโยงสมาคมธุรกิจข้ามพรมแดน

---

## Target Users
* **SMEs** (วิสาหกิจขนาดกลางและขนาดย่อม)
* **Exporters** (ผู้ส่งออก)
* **Importers** (ผู้นำเข้า)
* **Service Providers** (ผู้ให้บริการธุรกิจ)
* **Trade Associations** (สมาคมการค้าและหอการค้า)
* **Barter Exchanges** (เครือข่ายแลกเปลี่ยนสินค้าภายนอก)
* **Global Buyers** (ผู้ซื้อจากทั่วโลก)

---

## Technology Stack

### Frontend
* **Remix** (React Framework with SSR)
* **TypeScript** (Type safety)
* **Tailwind CSS** (Styling library)
* **Shadcn UI** (Component library)

### Backend
* **Cloudflare Workers** (Edge computing framework)

### Database & Storage
* **Supabase PostgreSQL** (Relational database)
* **Cloudflare R2** (S3-compatible object storage)

### Authentication
* **Supabase Auth** (Identity provider)

### AI
* **Workers AI** (Edge-native machine learning model execution)

### Integrations & Communications
* **Resend** (Email gateway)
* **LINE Messaging API** (Local communication in Thailand)

### Payments
* **Stripe** (Fiat payments, Escrow, Fees)
* **Wise** (Cross-border financial settlement)

### Deployment & Infrastructure
* **Cloudflare** (Domain, DNS, Edge network, and hosting)

---

## Architecture & Domain Structure

### Architecture Style
* **Domain Driven Design (DDD)**

### Business Domains
1. **Identity**: ระบบยืนยันตัวตนและการเข้าถึง (KYC/KYB, Auth)
2. **Membership**: ระบบสมาชิก สิทธิ์การใช้งาน และแพ็กเกจ (Subscriptions)
3. **Merchant**: ระบบบริหารจัดการร้านค้า โปรไฟล์ และการยืนยันธุรกิจ
4. **Marketplace**: ระบบแสดงรายการสินค้า/บริการ แคตตาล็อก และการซื้อขายแบบปกติ
5. **Directory**: แหล่งข้อมูลสมาคมการค้า ค้นหาร้านค้าแบบจับคู่
6. **Wallet**: ระบบกระเป๋าเงินสำหรับจัดการยอดเครดิตภายในระบบ
7. **Barter**: ตรรกะการเสนอแลกเปลี่ยน (Offers, Requests, Matching)
8. **Escrow**: ระบบล็อกเครดิตและประกันความปลอดภัยระหว่างทำสัญญาแลกเปลี่ยน
9. **Settlement**: ระบบจ่ายเงินสดและธุรกรรมการค้าต่างประเทศผ่าน Stripe & Wise
10. **AI**: ฟังก์ชันจับคู่อัจฉริยะ (Smart Matching), แปลภาษา และผู้ช่วยธุรกิจ
11. **Community**: กลุ่มสมาคม แชต และคอมมูนิตี้การทำกิจกรรม
12. **Administration**: ระบบหลังบ้านสำหรับดูแลจัดการระบบและการตรวจสอบ

---

## Design Philosophy
> **Global Standard** (มาตรฐานและคุณภาพระดับสากล)
> **Asian Relationship** (รักษาและต่อยอดสายสัมพันธ์การค้าสไตล์เอเชีย)
> **AI-Powered Commerce** (ขับเคลื่อนความสะดวกและขยายระบบด้วยเทคโนโลยี AI)
