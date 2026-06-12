import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { getSupabaseClient, supabaseAdmin } from "./supabase.server";
import { sendWelcomeEmail } from "./resend.server";
import { notifyAdminNewBusiness } from "./line.server";

// Configure encrypted session cookie storage
const sessionSecret = process.env.SESSION_SECRET || "default-secret-key-at-least-32-chars-long";

const storage = createCookieSessionStorage({
  cookie: {
    name: "unicorn_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
  },
});

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return storage.getSession(cookie);
}

// Get user ID from current session
export async function getUserId(request: Request): Promise<string | null> {
  const session = await getSession(request);
  const userId = session.get("userId");
  return userId || null;
}

// Middleware to enforce authentication
export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
): Promise<string> {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/auth/login?${searchParams}`);
  }
  return userId;
}

// Sign in with email and password
export async function login({ email, password, request }: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    throw new Error(error?.message || "Invalid credentials");
  }

  const session = await getSession(request);
  session.set("userId", data.user.id);
  session.set("accessToken", data.session?.access_token);

  return redirect("/app/dashboard", {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

// Register new B2B profile and merchant business
export async function register({
  email,
  password,
  companyName,
  registrationNumber,
  countryCode,
  industry,
  request,
}: any) {
  const supabase = getSupabaseClient();
  
  // 1. Sign up user via Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !signUpData.user) {
    throw new Error(signUpError?.message || "Registration failed");
  }

  const userId = signUpData.user.id;

  // 2. Insert merchant profile business record using admin client (bypasses RLS for initial sign-up)
  const { error: businessError } = await supabaseAdmin.from("businesses").insert({
    owner_id: userId,
    company_name: companyName,
    registration_number: registrationNumber,
    country_code: countryCode,
    industry: industry,
    verification_status: "pending",
  });

  if (businessError) {
    // Clean up user if business insert fails (compensation action)
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error(businessError.message || "Failed to create business profile");
  }

  // 3. Send welcome email + LINE alert to admin (non-blocking)
  Promise.all([
    sendWelcomeEmail(email, companyName).catch((e) =>
      console.error("[Auth] Welcome email failed:", e)
    ),
    notifyAdminNewBusiness(companyName, email, countryCode || "TH").catch((e) =>
      console.error("[Auth] LINE admin notify failed:", e)
    ),
  ]);

  // 4. Create session and redirect to dashboard
  const session = await getSession(request);
  session.set("userId", userId);
  session.set("accessToken", signUpData.session?.access_token);

  return redirect("/app/dashboard", {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

// Sign out and destroy cookie session
export async function logout(request: Request) {
  const session = await getSession(request);
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();

  return redirect("/", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}
