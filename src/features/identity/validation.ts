import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ message: "กรุณาระบุอีเมล" })
    .email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
  password: z
    .string({ message: "กรุณาระบุรหัสผ่าน" })
    .min(8, { message: "รหัสผ่านต้องมีความยาวไม่ต่ำกว่า 8 ตัวอักษร" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
