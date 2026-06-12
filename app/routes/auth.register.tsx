import { type ActionFunction, json } from "@remix-run/node";
import { Link, Form, useActionData, useNavigation } from "@remix-run/react";
import { register } from "~/utils/auth.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const companyName = formData.get("companyName") as string;
  const registrationNumber = formData.get("registrationNumber") as string;
  const countryCode = formData.get("countryCode") as string;
  const industry = formData.get("industry") as string;

  if (!email || !password || !companyName || !registrationNumber || !industry) {
    return json({ error: "All fields are required" }, { status: 400 });
  }

  try {
    return await register({
      email,
      password,
      companyName,
      registrationNumber,
      countryCode,
      industry,
      request,
    });
  } catch (error: any) {
    return json({ error: error.message || "Registration failed" }, { status: 400 });
  }
};

export default function Register() {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Register Business</h2>
        <p className="text-xs text-muted-foreground">
          สมัครสมาชิกเพื่อเข้าสู่ตลาดการแลกเปลี่ยนเครดิตระดับโลก
        </p>
      </div>

      {actionData?.error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground text-xs py-3.5 px-4 rounded-xl font-bold">
          ⚠️ {actionData.error}
        </div>
      )}

      <Form method="post" className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="companyName">
            Company Name
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            placeholder="Unicorn Co., Ltd."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
            Business Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="ceo@company.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="regNumber">
              Tax ID / Reg. No.
            </label>
            <input
              id="regNumber"
              name="registrationNumber"
              type="text"
              placeholder="01055XXXXXXXX"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="country">
              Country
            </label>
            <select
              id="country"
              name="countryCode"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary transition"
              defaultValue="TH"
            >
              <option value="TH" className="bg-background">Thailand</option>
              <option value="US" className="bg-background">United States</option>
              <option value="SG" className="bg-background">Singapore</option>
              <option value="JP" className="bg-background">Japan</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="industry">
            Industry Category
          </label>
          <input
            id="industry"
            name="industry"
            type="text"
            placeholder="Agriculture, Food & Beverage, Logistic, etc."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-primary/20 text-sm disabled:opacity-50"
        >
          {isSubmitting ? "Submitting Registration..." : "Submit Registration"}
        </button>
      </Form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-white/5"></div>
        <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase font-bold tracking-wider">or</span>
        <div className="flex-grow border-t border-white/5"></div>
      </div>

      <div className="text-center text-xs">
        <span className="text-muted-foreground">Already registered? </span>
        <Link to="/auth/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}

