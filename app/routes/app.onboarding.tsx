import { useState } from "react";
import { json, redirect, type LoaderFunction, type ActionFunction } from "@remix-run/cloudflare";
import { useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import { requireUserId } from "~/utils/auth.server";
import { supabaseAdmin } from "~/utils/supabase.server";
import { merchantOnboardingSchema } from "../../src/features/merchant/validation";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  // Fetch business profile if it exists
  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .single();

  // Fetch active membership plans
  let { data: plans } = await supabaseAdmin
    .from("membership_plans")
    .select("*")
    .eq("is_active", true);

  if (!plans || plans.length === 0) {
    // Seed default plans
    const defaultPlans = [
      {
        name: { th: "Silver Chapters", en: "Silver Chapters" },
        description: { th: "บัญชีสมาชิกแบบมาตรฐาน", en: "Standard membership account" },
        price_monthly: 0.00,
        price_yearly: 0.00,
        currency: "USD",
        features: ["5_listings", "wallet"],
        is_active: true
      },
      {
        name: { th: "Premium Gold", en: "Premium Gold" },
        description: { th: "สมาชิกระดับพรีเมียมพร้อมระบบจับคู่อัจฉริยะ", en: "Premium membership with smart matchmaker" },
        price_monthly: 99.00,
        price_yearly: 990.00,
        currency: "USD",
        features: ["unlimited_listings", "ai_matching", "escrow", "trade_associations"],
        is_active: true
      }
    ];

    const { data: seededPlans, error: seedError } = await supabaseAdmin
      .from("membership_plans")
      .insert(defaultPlans)
      .select();

    if (!seedError && seededPlans) {
      plans = seededPlans;
    }
  }

  return json({
    userId,
    business,
    plans: plans || [],
  });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  const rawData = {
    companyName: formData.get("companyName"),
    registrationNumber: formData.get("registrationNumber"),
    phone: formData.get("phone"),
    websiteUrl: formData.get("websiteUrl") || "",
    countryCode: formData.get("countryCode"),
    industry: formData.get("industry"),
    tradeDescription: formData.get("tradeDescription"),
    address: formData.get("address"),
    documentType: formData.get("documentType"),
    documentUrl: formData.get("documentUrl"),
    selectedPlanId: formData.get("selectedPlanId"),
  };

  // Validate fields with Zod
  const result = merchantOnboardingSchema.safeParse(rawData);
  if (!result.success) {
    return json({ 
      success: false, 
      errors: result.error.flatten().fieldErrors 
    }, { status: 400 });
  }

  const data = result.data;

  try {
    // Check if business profile exists
    const { data: existingBusiness } = await supabaseAdmin
      .from("businesses")
      .select("id, metadata")
      .eq("owner_id", userId)
      .single();

    let businessId: string;

    if (existingBusiness) {
      businessId = existingBusiness.id;
      // Update business profile
      const { error: updateError } = await supabaseAdmin
        .from("businesses")
        .update({
          company_name: data.companyName,
          registration_number: data.registrationNumber,
          country_code: data.countryCode,
          industry: data.industry,
          phone: data.phone,
          website_url: data.websiteUrl,
          metadata: {
            ...((existingBusiness.metadata as Record<string, any>) || {}),
            trade_description: data.tradeDescription,
            address: data.address,
          },
          verification_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", businessId);

      if (updateError) throw updateError;
    } else {
      // Create new business profile
      const { data: newBusiness, error: insertError } = await supabaseAdmin
        .from("businesses")
        .insert({
          owner_id: userId,
          company_name: data.companyName,
          registration_number: data.registrationNumber,
          country_code: data.countryCode,
          industry: data.industry,
          phone: data.phone,
          website_url: data.websiteUrl,
          metadata: {
            trade_description: data.tradeDescription,
            address: data.address,
          },
          verification_status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;
      businessId = newBusiness.id;
    }

    // Insert verification document
    const { error: docError } = await supabaseAdmin
      .from("business_verification_documents")
      .insert({
        business_id: businessId,
        document_type: data.documentType,
        document_url: data.documentUrl,
        status: "pending",
      });

    if (docError) throw docError;

    // Check existing subscription
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("business_id", businessId)
      .single();

    if (existingSub) {
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          plan_id: data.selectedPlanId,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", existingSub.id);

      if (subError) throw subError;
    } else {
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          business_id: businessId,
          plan_id: data.selectedPlanId,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (subError) throw subError;
    }

    return redirect("/app/dashboard");
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return json({ 
      success: false, 
      error: error.message || "Failed to save onboarding details" 
    }, { status: 500 });
  }
};

export default function Onboarding() {
  const { business, plans } = useLoaderData<{
    business: any;
    plans: any[];
  }>();

  const actionData = useActionData<{
    success: boolean;
    errors?: Record<string, string[]>;
    error?: string;
  }>();

  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [step, setStep] = useState(1);
  const defaultPlan = plans.find((p) => p.name?.en?.includes("Gold") || p.name?.th?.includes("Gold"))?.id || plans[0]?.id || "";

  const [formData, setFormData] = useState({
    companyName: business?.company_name || "",
    registrationNumber: business?.registration_number || "",
    phone: business?.phone || "",
    websiteUrl: business?.website_url || "",
    countryCode: business?.country_code || "TH",
    industry: business?.industry || "",
    tradeDescription: business?.metadata?.trade_description || "",
    address: business?.metadata?.address || "",
    documentType: "company_registration",
    documentUrl: "https://r2.unicorn-commerce.com/uploads/doc-placeholder.pdf", // Mock url
    selectedPlanId: defaultPlan,
  });

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handlePlanSelect = (planId: string) => {
    setFormData({ ...formData, selectedPlanId: planId });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      data.append(key, val);
    });
    submit(data, { method: "post" });
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col justify-center items-center p-6 selection:bg-primary selection:text-black">
      {/* Background radial highlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -z-10" />

      {/* Main card */}
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-8 md:p-12 shadow-2xl space-y-8 relative">
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-white">Merchant Onboarding</h1>
            <p className="text-xs text-muted-foreground font-medium">ขึ้นทะเบียนและยืนยันตนเพื่อสร้างความน่าเชื่อถือสำหรับการค้าระหว่างประเทศ</p>
          </div>
          <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Step {step} of 4
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden flex">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {actionData?.error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground text-xs py-3.5 px-4 rounded-xl font-bold">
            ⚠️ {actionData.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Business Profile */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="font-bold text-white text-base">Step 1: Business Profile (ข้อมูลนิติบุคคล)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="companyName">
                    Company / Entity Name
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Unicorn Global Link Co., Ltd."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                    required
                  />
                  {actionData?.errors?.companyName && (
                    <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.companyName[0]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="registrationNumber">
                    Tax ID / Reg. No.
                  </label>
                  <input
                    id="registrationNumber"
                    type="text"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="0105566XXXXXX"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                    required
                  />
                  {actionData?.errors?.registrationNumber && (
                    <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.registrationNumber[0]}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="02-123-4567"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                    required
                  />
                  {actionData?.errors?.phone && (
                    <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.phone[0]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="websiteUrl">
                    Website (Optional)
                  </label>
                  <input
                    id="websiteUrl"
                    type="text"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    placeholder="https://company.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                  />
                  {actionData?.errors?.websiteUrl && (
                    <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.websiteUrl[0]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="countryCode">
                    Country
                  </label>
                  <select
                    id="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-primary transition"
                  >
                    <option value="TH" className="bg-background">Thailand</option>
                    <option value="US" className="bg-background">United States</option>
                    <option value="SG" className="bg-background">Singapore</option>
                  </select>
                  {actionData?.errors?.countryCode && (
                    <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.countryCode[0]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="industry">
                  Industry Classification
                </label>
                <input
                  id="industry"
                  type="text"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="Agriculture, Food & Beverage, Renewable Energy, Tech Outsourcing"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                  required
                />
                {actionData?.errors?.industry && (
                  <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.industry[0]}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Trade Details */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="font-bold text-white text-base">Step 2: Trade & Logistics Details (รายละเอียดการค้า)</h3>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="tradeDescription">
                  Barter Inventory Description (สินค้าและบริการที่พร้อมนำมาแลกเปลี่ยน)
                </label>
                <textarea
                  id="tradeDescription"
                  rows={4}
                  value={formData.tradeDescription}
                  onChange={handleChange}
                  placeholder="เช่น ข้าวหอมมะลิเกรดส่งออกปริมาณ 10 ตันต่อเดือน หรือบริการพัฒนาคลาวด์ระบบบริหารจัดการสต็อก..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
                  required
                />
                {actionData?.errors?.tradeDescription && (
                  <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.tradeDescription[0]}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="address">
                  Warehouse / Corporate Office Address (ที่อยู่จัดส่งและคลังสินค้า)
                </label>
                <textarea
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="ที่ตั้งคลังสินค้าหลักหรืออาคารสำนักงานใหญ่..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
                  required
                />
                {actionData?.errors?.address && (
                  <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.address[0]}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Document Verification */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="font-bold text-white text-base">Step 3: Document Upload (อัปโหลดเอกสารยืนยันนิติบุคคล)</h3>
              
              <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="documentType">
                    Document Type
                  </label>
                  <select
                    id="documentType"
                    value={formData.documentType}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-primary transition"
                  >
                    <option value="company_registration" className="bg-background">Certificate of Incorporation (หนังสือรับรองบริษัท)</option>
                    <option value="tax_certificate" className="bg-background">Value Added Tax Registry (ภ.พ.20)</option>
                    <option value="fda_certificate" className="bg-background">FDA/Standard Product License (ใบอนุญาตสินค้า)</option>
                  </select>
                  {actionData?.errors?.documentType && (
                    <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.documentType[0]}</p>
                  )}
                </div>

                <div className="border-2 border-dashed border-white/10 hover:border-primary/50 transition rounded-2xl p-8 text-center space-y-3 relative">
                  <div className="text-4xl">📄</div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">Upload Official PDF Document</span>
                    <span className="text-[10px] text-muted-foreground block font-medium">Support files: PDF, PNG, JPG (Max 5MB)</span>
                  </div>
                  <button type="button" className="text-xs font-bold text-primary hover:underline">
                    Browse Files
                  </button>
                  <div className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 py-1 px-3 rounded-full inline-block mt-2 border border-emerald-500/20">
                    ✓ Mock-doc-uploaded.pdf (Simulated on Cloudflare R2)
                  </div>
                  <input type="hidden" id="documentUrl" value={formData.documentUrl} />
                  {actionData?.errors?.documentUrl && (
                    <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.documentUrl[0]}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Plan Selection */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="font-bold text-white text-base">Step 4: Membership Plan (เลือกสิทธิ์ใช้งานระบบการค้า)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => {
                  const isSelected = formData.selectedPlanId === plan.id;
                  const planName = plan.name?.en || plan.name?.th || plan.name || "";
                  const isGold = planName.includes("Gold") || planName.includes("Premium") || Number(plan.price_monthly) > 0;
                  
                  return (
                    <div
                      key={plan.id}
                      onClick={() => handlePlanSelect(plan.id)}
                      className={`glass-card p-6 rounded-2xl border cursor-pointer space-y-3 transition relative overflow-hidden ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                          : "border-white/5 hover:border-white/20"
                      }`}
                    >
                      {isGold && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-primary to-secondary opacity-10 rounded-full blur-xl" />
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-base">
                          {plan.name?.th || plan.name?.en || plan.name}
                        </span>
                        <span className={`text-[9px] font-extrabold py-0.5 px-2.5 rounded-full ${
                          isGold ? "bg-primary text-black" : "bg-white/10 text-white"
                        }`}>
                          {isGold ? "POPULAR" : "BASIC"}
                        </span>
                      </div>
                      <h4 className={`text-2xl font-black ${isGold ? "text-primary" : "text-white"}`}>
                        {Number(plan.price_monthly) === 0 ? "Free" : `$${Number(plan.price_monthly).toFixed(2)}`}
                        <span className="text-xs font-normal text-muted-foreground"> / month</span>
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed pt-2">
                        {plan.features?.map((feat: string, index: number) => {
                          let label = feat;
                          if (feat === "5_listings") label = "ลงรายการสินค้าแลกเปลี่ยนได้ 5 รายการ";
                          else if (feat === "wallet") label = "บัญชีกระเป๋า Unicorn Credits";
                          else if (feat === "unlimited_listings") label = "ลงรายการได้ไม่จำกัด (Unlimited Listings)";
                          else if (feat === "ai_matching") label = "AI Smart Matchmaker ช่วยสแกนดีล";
                          else if (feat === "escrow") label = "บัญชีค้ำประกัน Escrow ปลอดภัยไร้กังวล";
                          else if (feat === "trade_associations") label = "สิทธิเข้าร่วมสมาคมและหอการค้าข้ามชาติ";
                          return <li key={index}>• {label}</li>;
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
              {actionData?.errors?.selectedPlanId && (
                <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.selectedPlanId[0]}</p>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center border-t border-white/5 pt-6 mt-8">
            <button
              type="button"
              onClick={prevStep}
              className={`text-xs font-bold py-3 px-6 rounded-xl transition ${
                step === 1
                  ? "text-muted-foreground cursor-not-allowed opacity-50"
                  : "text-white hover:bg-white/5"
              }`}
              disabled={step === 1 || isSubmitting}
            >
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-primary hover:bg-primary/90 text-black text-xs font-bold py-3.5 px-6 rounded-xl transition shadow-lg shadow-primary/20"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-primary to-emerald-600 hover:opacity-95 text-white text-xs font-bold py-3.5 px-6 rounded-xl transition shadow-lg shadow-primary/25 disabled:opacity-50"
              >
                {isSubmitting ? "Completing Onboarding..." : "Complete Onboarding"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
