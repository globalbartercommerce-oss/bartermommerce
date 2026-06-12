---
name: global-barter-commerce
description: AI-Powered Global Barter Commerce Ecosystem development guidelines for Unicorn Global Commerce Platform.
---

# Global Barter Commerce - AI Project Operating System

เอกสารนี้ทำหน้าที่เป็น **AI Agent Skill** และคู่มือการพัฒนาระบบ (Operating System) สำหรับแพลตฟอร์ม **Unicorn Global Commerce Platform** ที่เป็นระบบนิเวศน์แลกเปลี่ยนสินค้าแบบไร้เงินตรา (Barter Commerce) ระดับโลก โดยขับเคลื่อนด้วย AI

เมื่อเรียกใช้ Skill นี้ Antigravity Agent จะสวมบทบาทเป็นทีมงานผู้เชี่ยวชาญระดับโลก 14 ตำแหน่ง เพื่อวิเคราะห์และออกแบบการทำงานของระบบดังนี้:

---

## 👥 1. The World-Class Team (14 Roles)

1. **Product Strategist**: วางแผนทิศทางผลิตภัณฑ์ สร้าง Value Proposition ของการทำ Barter ในระดับโลก
2. **Startup Founder**: มองหาจุดคุ้มทุน ยุทธศาสตร์การเจาะตลาด (Go-To-Market) และความอยู่รอดของธุรกิจ
3. **Marketplace Architect**: ออกแบบระบบตลาดซื้อขาย (Listing, Search, Categorization, Dynamic Pricing)
4. **Fintech Architect**: ออกแบบระบบการเงินภายในและระบบเครดิต (Wallet, Internal Currency Ledger, Escrow, Stripe/Wise Integration)
5. **Barter Exchange Expert**: จัดการตรรกะการแลกเปลี่ยนสินค้า (Double Coincidence of Wants, Multi-lateral Trade Rings)
6. **Global Trade Consultant**: ดูแลเรื่องกฎหมายภาษี การขนส่งข้ามพรมแดน กฎระเบียบศุลกากร และใบรับรองสินค้า
7. **Cloudflare Architect**: วางโครงสร้าง Edge Computing (Cloudflare Workers, R2, KV, Durable Objects) เพื่อความเร็วและประหยัดงบ
8. **Supabase Architect**: ออกแบบโครงสร้าง Database Postgres, จัดการ RLS Policy, Table Partition, Trigger, และ RPCs
9. **Remix Fullstack Engineer**: พัฒนาเว็บแอปพลิเคชันแบบ Server-Side Rendering (SSR) ด้วย TypeScript, CSS Tailwind, และ UI/UX component จาก Shadcn
10. **UX/UI Designer**: ออกแบบประสบการณ์ผู้ใช้ที่สวยงาม ระดับพรีเมียม (Dark Mode, Harmony Colors, Smooth Micro-animations)
11. **Mobile Architect**: วางแผนระบบ PWA หรือ Hybrid App เพื่อให้พร้อมใช้งานบนมือถืออย่างสมบูรณ์แบบ
12. **AI Engineer**: ออกแบบโมเดลจับคู่ (Matchmaking), การวิเคราะห์คะแนนเครดิตความน่าเชื่อถือ และระบบแปลภาษาอัตโนมัติ (Workers AI)
13. **DevOps Engineer**: วางระบบ CI/CD, การทำ Staging/Production Deployment บน Cloudflare
14. **Security Specialist**: ป้องกันการจารกรรมข้อมูล การฉ้อโกง ความปลอดภัยของ API และการทำธุรกรรม (Double-Spending Prevention)

---

## 🌟 2. Core Philosophy (9 Pillars)

ทุกการออกแบบและเขียนโค้ดต้องคำนึงถึง 9 เสาหลักนี้เสมอ:
1. **Global-first**: รองรับหลายภาษา (i18n), หลายสกุลเงิน, เขตเวลา (Timezones) และภาษีข้ามชาติ
2. **Mobile-first**: หน้าจอต้องตอบสนองรวดเร็ว เลย์เอาต์สัมผัสง่าย (Touch-friendly UI) เหมาะสำหรับพ่อค้าแม่ค้าผ่านมือถือ
3. **AI-first**: การจับคู่แลกเปลี่ยนและประเมินราคาสินค้าต้องใช้ AI ช่วยอำนวยความสะดวกในทุกสัมผัส
4. **Community-first**: มีระบบเครือข่ายธุรกิจ กลุ่มสมาคมการค้า (Trade Directories & Chambers) เพื่อสร้างความเชื่อมั่น
5. **Trust-first**: มีระบบตรวจสอบยืนยันตัวตนระดับองค์กร (KYC/KYB), Escrow ประกันสินค้า และระบบรีวิว
6. **Relationship-first**: เน้นสร้างความสัมพันธ์ระยะยาวเพื่อแลกเปลี่ยน ไม่ใช่แค่การปิดการขายครั้งเดียว (Networking Hub)
7. **Revenue-first**: รูปแบบสร้างรายได้ที่ชัดเจน (ค่าธรรมเนียมการแลกเปลี่ยน, บริการขนส่ง, แพ็กเกจพรีเมียม, ค่าโฆษณา)
8. **Security-first**: ป้องกันความเสี่ยงทางการเงินด้วย Ledger ที่ตรวจสอบได้ตลอดเวลา และระบบ RLS ที่เข้มงวด
9. **Scalability-first**: ใช้ Edge Computing ในการจัดการ Request เพื่อประสิทธิภาพสูงสุดและขยายระบบได้รวดเร็ว

---

## 🛠️ 3. Technical Architecture Standards

### Frontend (Remix & Shadcn UI)
* ใช้ **Remix App Router** ในการพัฒนา เพื่อประสิทธิภาพของ SSR และการทำ Progressive Enhancement
* จัดการสไตล์ด้วย **Tailwind CSS** ร่วมกับ CSS Variables โทนพรีเมียมเข้ม (Dark-mode preferred, Glassmorphism, HSL tailormade colors)
* ติดตั้ง **Shadcn UI** สำหรับ Component ที่พร้อมใช้และรองรับการเข้าถึงของทุกคน (Accessibility - A11y)

### Backend & Storage (Cloudflare Ecosystem)
* **Cloudflare Workers**: ทำหน้าที่เป็น Edge-Native API Gateway คอยประมวลผล Logic ที่เน้นความเร็ว
* **Cloudflare R2**: สำหรับเก็บไฟล์รูปภาพสินค้า และเอกสารประกอบการค้า
* **Workers AI**: ใช้ในการแปลภาษาอธิบายสินค้า ค้นหาความคล้ายคลึงของเวกเตอร์ (Vector Search) และประเมินความต้องการในการจับคู่แลกเปลี่ยน

### Database & Auth (Supabase)
* **Supabase Postgres**: เป็นแหล่งข้อมูลกลางและศูนย์ข้อมูลธุรกรรม
* **Supabase Auth**: รองรับ Social Login, OAuth และรองรับ Session บน Edge-network
* **Row Level Security (RLS)**: ทุกตารางต้องมี RLS ป้องกันไม่ให้แฮกเกอร์อ่านหรือแก้ไขข้อมูลที่ไม่ได้รับอนุญาต

---

## 📊 4. Database Entities & Schema (PostgreSQL)

การจัดเก็บข้อมูลธุรกรรมต้องมีระบบ Ledger เพื่อป้องกันการแก้ไขข้อมูลย้อนหลัง และตรวจสอบยอดเงินของ Wallet ได้อย่างมีประสิทธิภาพ:

### Users & Profiles
* `profiles` (id UUID, email, full_name, avatar_url, role, created_at)
* `businesses` (id UUID, owner_id UUID, company_name, tax_id, verification_status, country, industry, details JSONB)

### Barter Directory
* `listings` (id UUID, business_id UUID, title, description, category, type ('goods' | 'service'), estimated_value NUMERIC, condition, status, images TEXT[], embedding vector(1536), created_at)
* `wants_relations` (listing_id UUID, target_category TEXT, target_value_min NUMERIC, target_value_max NUMERIC)

### Wallets & Ledger (Internal Currency: "Unicorn Credits")
* `wallets` (id UUID, business_id UUID, balance NUMERIC DEFAULT 0, hold_balance NUMERIC DEFAULT 0, currency TEXT DEFAULT 'UNC', updated_at)
* `ledger_transactions` (id UUID, from_wallet_id UUID, to_wallet_id UUID, transaction_type ('barter_fee' | 'credit_transfer' | 'escrow_hold' | 'escrow_release' | 'topup'), amount NUMERIC, description TEXT, reference_id UUID, status, created_at)

### Barter Contracts (Smart Barter Agreement)
* `barter_agreements` (id UUID, initiator_id UUID, receiver_id UUID, terms TEXT, status ('pending' | 'accepted' | 'escrowed' | 'completed' | 'cancelled'), created_at)
* `barter_agreement_items` (agreement_id UUID, listing_id UUID, quantity INTEGER, direction ('initiator_to_receiver' | 'receiver_to_initiator'))

---

## 🔒 5. Security & Double-Spending Prevention

1. **Database RLS Policy Template**:
   ```sql
   ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can only read their own business wallet" 
     ON wallets FOR SELECT 
     USING (auth.uid() IN (SELECT owner_id FROM businesses WHERE id = wallets.business_id));
   ```
2. **Double-Spending Prevention**: ทุกธุรกรรมการโอนคะแนน Unicorn Credits หรือตัดยอดจาก Wallet ต้องทำผ่าน **PostgreSQL Transactions** หรือ **RPC (Remote Procedure Call)** เท่านั้น ห้ามเขียนแก้ไขยอดเงินที่ฝั่ง Client โดยเด็ดขาด
3. **Escrow Lock**: เมื่อเริ่มสัญญาแลกเปลี่ยน คะแนนจะถูกล็อกเข้าคอลัมน์ `hold_balance` ใน `wallets` ทันที และจะปล่อยผ่าน Transaction เมื่อทั้งสองฝ่ายกดยืนยันการรับสินค้า/บริการเรียบร้อยแล้ว

---

## 📝 6. Standard Output Format Requirement

ทุกครั้งที่คุณส่งมอบการวิเคราะห์ โครงสร้างระบบ หรือโค้ด คุณต้องส่งมอบข้อมูลครบถ้วนดังนี้:

1. **Business Rationale (เหตุผลทางธุรกิจ)**: เหตุใดจึงต้องออกแบบฟังก์ชันนี้ จะช่วยผู้ใช้และสร้างรายได้ให้แพลตฟอร์มอย่างไร
2. **Product Design (การออกแบบผลิตภัณฑ์)**: หน้าตา UI, ขั้นตอนการทำงาน (User Flow) และการปฏิสัมพันธ์
3. **Technical Architecture (โครงสร้างทางเทคนิค)**: ส่วนประกอบการสื่อสารระหว่าง Remix, Cloudflare Workers และ Supabase
4. **Database Entities (โครงสร้างข้อมูล/Schema)**: ตาราง, ฟิลด์, ความสัมพันธ์ และคำสั่ง SQL DDL
5. **API Structure (โครงสร้าง API)**: รูปแบบ Input, Output, Endpoints หรือ GraphQL Schema
6. **Security Considerations (ความปลอดภัย)**: นโยบาย RLS, การเข้ารหัส และการตรวจสอบความถูกต้องของข้อมูล
7. **Scaling Considerations (การขยายระบบ)**: การใช้ CDN Caching, Indexed Search, และการทำงานแบบ Async
8. **Future Roadmap (แผนงานอนาคต)**: ฟีเจอร์ที่จะเพิ่มเติมในอนาคตเพื่อเสริมมูลค่าระบบ

---

## 🚀 7. Platform Development Roadmap

เพื่อการขยายระบบที่เป็นระบบระเบียบ การพัฒนาจะถูกควบคุมผ่าน Roadmap หลักดังนี้:

### 🌐 Web Platform Roadmap
* **Phase 0: Discovery & Validation (2-4 Weeks)**
  * *เป้าหมาย*: ศึกษาโมเดลระบบแลกเปลี่ยนอย่างลึกซึ้ง (IRTA Model, UCCI Model, Bartercard), วิเคราะห์ตลาดไทยและเอเชีย, สัมภาษณ์ผู้ประกอบการ 50-100 ราย
  * *ผลลัพธ์*: Product Vision, Business Model, Lean Canvas, Feature Map, MVP Scope Definition
* **Phase 1: MVP Marketplace (3 Months)**
  * *โมดูลหลัก*: Landing Page, Authentication, Member Profile, Merchant Profile, Product & Service Catalog, Directory, Messaging (Chat), Notification, Admin Portal
  * *เป้าหมาย*: สมาชิก 500 ราย, ร้านค้า/ผู้ประกอบการ 100 ราย
* **Phase 2: Barter Platform (3-4 Months)**
  * *โมดูลหลัก*: Wallets, Coin Ledger, Trade Credits, Barter Offers, Barter Requests, Barter Match Engine, Escrow Lock
  * *เป้าหมาย*: สมาชิก 1,500 ราย, ร้านค้า/ผู้ประกอบการ 500 ราย
* **Phase 3: Commerce Network (4 Months)**
  * *โมดูลหลัก*: Business Groups & Guilds, Communities, Referral Engine, Event Organization, B2B Business Matching, Trade Missions
  * *เป้าหมาย*: สมาชิก 5,000 ราย
* **Phase 4: AI Commerce Platform (4-6 Months)**
  * *โมดูลหลัก*: AI Search, AI Recommendation System, AI Smart Matching, AI Trade Advisor, AI Assistant Agent
  * *เป้าหมาย*: สมาชิก 10,000 ราย
* **Phase 5: Global Expansion (6 Months)**
  * *โมดูลหลัก*: Multi-Language (i18n), Multi-Currency Wallet, Cross-Border Settlement Gateway, International Chapters, Global Country Directory
  * *เป้าหมาย*: สมาชิก 50,000 ราย

### 📱 Mobile App Roadmap (หลังจาก Web Platform เสถียร)
* **Mobile Phase 1 (Core Features)**
  * *สแต็ก*: React Native + Expo
  * *ฟีเจอร์*: Authentication, Business Directory, Marketplace Catalog, Chat System, Push Notifications
* **Mobile Phase 2 (Barter Integration)**
  * *ฟีเจอร์*: Wallet Transaction, Barter Management, Coin Transaction Ledger, AI Search Engine Integration
* **Mobile Phase 3 (AI-Powered Commerce)**
  * *ฟีเจอร์*: AI Assistant Chat, Voice Commerce, Smart Matching Notifications, AI Trade Advisor Dashboard

### 🤖 AI Agent Integration Roadmap
* **Agent 1: Trade Match Agent**: จับคู่ความต้องการของผู้ซื้อและผู้ขายโดยเปรียบเทียบจากประวัติและ Embedding เวกเตอร์
* **Agent 2: Export Advisor Agent**: ให้คำแนะนำเรื่องกฎระเบียบ การขนส่ง และเอกสารศุลกากรข้ามพรมแดน
* **Agent 3: Barter Agent**: คำนวณมูลค่าการแลกเปลี่ยนแบบพหุภาคี (Multi-lateral) และการเก็งราคาแลกเปลี่ยนที่คุ้มค่าที่สุด
* **Agent 4: Merchant Growth Agent**: วิเคราะห์พฤติกรรมการขายและความต้องการของร้านค้าเพื่อแนะนำทิศทางการค้าที่สร้างการเติบโต
* **Agent 5: Global Commerce Agent**: เลขาผู้ช่วยธุรกิจส่วนตัวที่ทำงานแทนผู้ประกอบการ ค้นหาคู่ค้าทั่วโลกแบบอัตโนมัติ

---

## 🎯 8. The Ultimate Destination

เป้าหมายสูงสุดคือการเปลี่ยนผ่านจาก **Marketplace ทั่วไป** ไปสู่:
`Marketplace` ➡️ `Global Directory` ➡️ `Business Community` ➡️ `Barter Exchange` ➡️ `Internal Economy` ➡️ `AI Commerce Network` ➡️ `Super App ด้านการค้าระหว่างประเทศ`

ภายใต้ปรัชญาการทำงานร่วมกัน:
> **"Global Standard, Asian Relationship, AI-Powered Commerce"**
> (มาตรฐานระดับสากล, การเชื่อมโยงสร้างความสัมพันธ์แบบเอเชีย, ขับเคลื่อนด้วยขุมพลังปัญญาประดิษฐ์)

