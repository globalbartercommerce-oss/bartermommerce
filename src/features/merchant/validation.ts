import { z } from "zod";

export const merchantOnboardingSchema = z.object({
  // Step 1: Business Profile
  companyName: z
    .string({ message: "กรุณาระบุชื่อบริษัท/นิติบุคคล" })
    .min(2, { message: "ชื่อบริษัทต้องมีความยาวไม่ต่ำกว่า 2 ตัวอักษร" }),
  registrationNumber: z
    .string({ message: "กรุณาระบุเลขทะเบียนการค้า/ผู้เสียภาษี" })
    .min(5, { message: "เลขทะเบียนการค้าต้องมีความยาวไม่ต่ำกว่า 5 ตัวอักษร" }),
  phone: z
    .string({ message: "กรุณาระบุเบอร์โทรศัพท์ติดต่อ" })
    .min(9, { message: "เบอร์โทรศัพท์ไม่ถูกต้อง" }),
  websiteUrl: z
    .string()
    .url({ message: "รูปแบบลิงก์เว็บไซต์ไม่ถูกต้อง" })
    .or(z.literal("")),
  countryCode: z
    .string({ message: "กรุณาระบุประเทศ" })
    .length(2, { message: "รหัสประเทศต้องมีความยาว 2 ตัวอักษร" }),
  industry: z
    .string({ message: "กรุณาระบุหมวดหมู่อุตสาหกรรม" })
    .min(2, { message: "กรุณาระบุอุตสาหกรรมธุรกิจ" }),

  // Step 2: Trade Details
  tradeDescription: z
    .string({ message: "กรุณาระบุรายละเอียดสินค้าหรือบริการที่จะแลกเปลี่ยน" })
    .min(10, { message: "รายละเอียดการค้าต้องไม่ต่ำกว่า 10 ตัวอักษร" }),
  address: z
    .string({ message: "กรุณาระบุที่อยู่สำนักงาน" })
    .min(5, { message: "ที่อยู่ต้องไม่ต่ำกว่า 5 ตัวอักษร" }),

  // Step 3: Document Verification (Document URLs in simulated upload)
  documentType: z.enum(["company_registration", "tax_certificate", "fda_certificate"], {
    message: "ประเภทเอกสารไม่ถูกต้อง",
  }),
  documentUrl: z
    .string({ message: "กรุณาอัปโหลดเอกสารประกอบการยืนยัน" })
    .url({ message: "ลิงก์เอกสารไม่ถูกต้อง" }),

  // Step 4: Plan Selection
  selectedPlanId: z
    .string({ message: "กรุณาเลือกสิทธิ์และแพ็กเกจการใช้งาน" })
    .min(1, { message: "กรุณาเลือกสิทธิ์และแพ็กเกจการใช้งาน" }),
});

export type MerchantOnboardingInput = z.infer<typeof merchantOnboardingSchema>;
