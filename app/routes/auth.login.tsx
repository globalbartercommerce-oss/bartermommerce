import { type ActionFunction, json } from "@remix-run/cloudflare";
import { Link, Form, useActionData, useNavigation } from "@remix-run/react";
import { login } from "~/utils/auth.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return json({ error: "Email and password are required" }, { status: 400 });
  }

  try {
    return await login({ email, password, request });
  } catch (error: any) {
    return json({ error: error.message || "Invalid credentials" }, { status: 400 });
  }
};

export default function Login() {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Sign In to Platform</h2>
        <p className="text-xs text-muted-foreground">
          เข้าสู่ระบบเพื่อจัดการกระเป๋า Unicorn Credits และข้อเสนอดีล
        </p>
      </div>

      {actionData?.error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground text-xs py-3.5 px-4 rounded-xl font-bold">
          ⚠️ {actionData.error}
        </div>
      )}

      <Form method="post" className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
            Business Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="name@company.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">
              Password
            </label>
            <a href="#forgot" className="text-xs font-semibold text-primary hover:underline">
              Forgot?
            </a>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-primary/20 text-sm disabled:opacity-50"
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </Form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-white/5"></div>
        <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase font-bold tracking-wider">or</span>
        <div className="flex-grow border-t border-white/5"></div>
      </div>

      <div className="text-center text-xs">
        <span className="text-muted-foreground">Don't have a business registered yet? </span>
        <Link to="/auth/register" className="font-semibold text-primary hover:underline">
          Register Business
        </Link>
      </div>
    </div>
  );
}

