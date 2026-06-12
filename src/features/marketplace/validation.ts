import { z } from "zod";

export const listingSchema = z.object({
  title: z
    .string({ message: "กรุณาระบุชื่อสินค้าหรือบริการ" })
    .min(3, { message: "ชื่อสินค้าต้องมีความยาวไม่ต่ำกว่า 3 ตัวอักษร" })
    .max(100, { message: "ชื่อสินค้าต้องยาวไม่เกิน 100 ตัวอักษร" }),
  description: z
    .string({ message: "กรุณาระบุรายละเอียดสินค้าหรือบริการ" })
    .min(10, { message: "รายละเอียดต้องมีความยาวไม่ต่ำกว่า 10 ตัวอักษร" }),
  categoryId: z
    .string()
    .uuid({ message: "หมวดหมู่ข้อมูลไม่ถูกต้อง" })
    .nullable()
    .optional(),
  type: z.enum(["goods", "service"], {
    message: "กรุณาระบุประเภทสินค้าหรือบริการให้ถูกต้อง",
  }),
  estimatedValue: z
    .number({ message: "กรุณาระบุมูลค่าตลาดประเมิน" })
    .positive({ message: "มูลค่าต้องมากกว่า 0" }),
  priceCredits: z
    .number({ message: "กรุณาระบุมูลค่า Unicorn Credits" })
    .positive({ message: "มูลค่าเครดิตต้องมากกว่า 0" }),
  condition: z.enum(["new", "used_like_new", "used_good", "used_fair"], {
    message: "สภาพสินค้าไม่ถูกต้อง",
  }),
});

export type ListingInput = z.infer<typeof listingSchema>;
