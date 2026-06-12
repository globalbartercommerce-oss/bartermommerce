import { useState, useEffect, useRef, useCallback } from "react";
import {
  json,
  unstable_parseMultipartFormData,
  unstable_createMemoryUploadHandler,
  type LoaderFunction,
  type ActionFunction,
} from "@remix-run/cloudflare";
import { useLoaderData, useActionData, useSubmit, useNavigation, Form } from "@remix-run/react";
import { requireUserId } from "~/utils/auth.server";
import { supabaseAdmin } from "~/utils/supabase.server";
import { listingSchema } from "../../src/features/marketplace/validation";
import { uploadToR2, isR2Configured } from "~/utils/r2.server";

interface CategoryName {
  th: string;
  en: string;
}

interface Category {
  id: string;
  name: CategoryName;
}

interface BusinessInfo {
  company_name: string;
  country_code: string;
}

interface ListingCategory {
  name: CategoryName;
}

interface ListingItem {
  id: string;
  title: string;
  description: string;
  type: string;
  estimated_value: number | string;
  price_credits: number | string;
  condition: string;
  images: string[];
  business?: BusinessInfo;
  category?: ListingCategory;
}

interface LoaderData {
  listings: ListingItem[];
  categories: Category[];
  business: { id: string; company_name: string } | null;
  q: string;
  category: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const categoryId = url.searchParams.get("category") || "";

  // 1. Fetch user's business profile
  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, company_name")
    .eq("owner_id", userId)
    .single();

  // 2. Fetch categories
  let { data: categories } = await supabaseAdmin
    .from("directory_categories")
    .select("*")
    .eq("is_active", true);

  if (!categories || categories.length === 0) {
    // Seed default categories
    const defaultCategories = [
      { name: { th: "เกษตรกรรมและอาหาร", en: "Agriculture & Food" }, slug: "agriculture-food" },
      { name: { th: "พลังงานและไฟฟ้า", en: "Energy & Electricity" }, slug: "energy-electricity" },
      { name: { th: "เทคโนโลยีสารสนเทศ", en: "Information Technology" }, slug: "information-technology" },
      { name: { th: "อุตสาหกรรมบรรจุภัณฑ์", en: "Packaging & Cardboard" }, slug: "packaging" },
    ];
    const { data: seededCats, error: seedError } = await supabaseAdmin
      .from("directory_categories")
      .insert(defaultCategories)
      .select();
    if (!seedError && seededCats) {
      categories = seededCats;
    }
  }

  // 3. Build listings query
  let query = supabaseAdmin
    .from("listings")
    .select(`
      id,
      title,
      description,
      type,
      estimated_value,
      price_credits,
      condition,
      images,
      business:businesses(company_name, country_code),
      category:directory_categories(name)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  
  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data: listings, error: listingsError } = await query;
  if (listingsError) {
    console.error("Listings fetch error:", listingsError);
  }

  return json<LoaderData>({
    listings: (listings as unknown as ListingItem[]) || [],
    categories: (categories as unknown as Category[]) || [],
    business,
    q,
    category: categoryId,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  // Parse multipart form data (supports file uploads)
  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: 10 * 1024 * 1024, // 10MB
  });
  const formData = await unstable_parseMultipartFormData(request, uploadHandler);

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId") || null,
    type: formData.get("type"),
    estimatedValue: Number(formData.get("estimatedValue")),
    priceCredits: Number(formData.get("priceCredits")),
    condition: formData.get("condition"),
  };

  // Validate payload
  const result = listingSchema.safeParse(rawData);
  if (!result.success) {
    return json({
      success: false,
      errors: result.error.flatten().fieldErrors,
    }, { status: 400 });
  }

  const data = result.data;

  try {
    // 1. Fetch current business ID
    const { data: business, error: busError } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .single();

    if (busError || !business) {
      throw new Error("ไม่พบข้อมูลร้านค้าของคุณ กรุณาทำ Onboarding ก่อน");
    }

    // 2. Upload images to Cloudflare R2
    const imageUrls: string[] = [];
    const imageFiles = formData.getAll("images") as File[];
    const validImages = imageFiles.filter((f) => f instanceof File && f.size > 0);

    if (validImages.length > 0 && isR2Configured()) {
      for (const file of validImages.slice(0, 5)) {
        if (!file.type.startsWith("image/")) continue;
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadToR2(buffer, file.name, "listings");
        imageUrls.push(result.url);
      }
    }

    // Fallback: use emoji placeholder if no images uploaded or R2 not configured
    if (imageUrls.length === 0) {
      let imageEmoji = "📦";
      if (data.type === "service") imageEmoji = "💼";
      else if (data.title.includes("ข้าว") || data.title.toLowerCase().includes("rice")) imageEmoji = "🌾";
      else if (data.title.toLowerCase().includes("energy") || data.title.toLowerCase().includes("solar")) imageEmoji = "🔋";
      else if (data.title.toLowerCase().includes("ai") || data.title.toLowerCase().includes("software")) imageEmoji = "💻";
      imageUrls.push(imageEmoji);
    }

    // 3. Insert listing record
    const { error: insertError } = await supabaseAdmin
      .from("listings")
      .insert({
        business_id: business.id,
        title: data.title,
        description: data.description,
        category_id: data.categoryId,
        type: data.type,
        estimated_value: data.estimatedValue,
        price_credits: data.priceCredits,
        condition: data.condition,
        images: imageUrls,
        status: "active",
        metadata: { r2_upload: validImages.length > 0 && isR2Configured() },
      });

    if (insertError) throw insertError;

    return json({ success: true });
  } catch (error: any) {
    console.error("Listing creation error:", error);
    return json({
      success: false,
      error: error.message || "Failed to create listing",
    }, { status: 500 });
  }
};

export default function Marketplace() {
  const { listings, categories, business, q, category } = useLoaderData<LoaderData>();
  const actionData = useActionData<{ success: boolean; errors?: any; error?: string }>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image preview
  const handleImageChange = useCallback((files: FileList | null) => {
    if (!files) return;
    const urls: string[] = [];
    Array.from(files).slice(0, 5).forEach((file) => {
      if (file.type.startsWith("image/")) {
        urls.push(URL.createObjectURL(file));
      }
    });
    setPreviewUrls(urls);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageChange(e.dataTransfer.files);
    if (fileInputRef.current && e.dataTransfer.files.length > 0) {
      const dt = new DataTransfer();
      Array.from(e.dataTransfer.files).forEach((f) => dt.items.add(f));
      fileInputRef.current.files = dt.files;
    }
  }, [handleImageChange]);

  // Close modal and reset form on action success
  useEffect(() => {
    if (actionData?.success) {
      setIsModalOpen(false);
      formRef.current?.reset();
    }
  }, [actionData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    submit(e.currentTarget.form);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    submit(e.currentTarget.form);
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Global Marketplace</h2>
          <p className="text-xs text-muted-foreground font-medium">
            ค้นหาและร่วมเสนอสัญญาแลกเปลี่ยนสินค้าและบริการ B2B ในระบบเครือข่ายธุรกิจ
          </p>
        </div>
        {business && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-black text-xs font-bold py-3.5 px-5 rounded-xl transition shadow-lg shadow-primary/20"
          >
            + Add New Listing
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <Form method="get" className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          onChange={handleSearchChange}
          placeholder="ค้นหาสินค้า บริการ หรือคู่ค้า..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
        />
        <select
          name="category"
          defaultValue={category}
          onChange={handleCategoryChange}
          className="bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-primary transition"
        >
          <option value="" className="bg-background">ทุกหมวดหมู่ (All Categories)</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id} className="bg-background">
              {cat.name.th} ({cat.name.en})
            </option>
          ))}
        </select>
      </Form>

      {/* Catalog Grid */}
      {listings.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-3xl border border-white/5 space-y-2">
          <p className="text-base font-bold text-white">ไม่พบรายการสินค้าที่ค้นหา</p>
          <p className="text-xs text-muted-foreground">ลองเปลี่ยนคำค้นหาหรือตัวกรองหมวดหมู่อื่น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {listings.map((item) => (
            <div key={item.id} className="glass-card p-6 rounded-2xl flex gap-6 items-start">
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                {item.images?.[0]?.startsWith("http") ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  item.images?.[0] || "📦"
                )}
              </div>
              <div className="space-y-4 flex-1 min-w-0">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20">
                    {item.category?.name?.th || "ทั่วไป"}
                  </span>
                  <h3 className="font-extrabold text-white text-base truncate pt-1">{item.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <span>Owner:</span>
                    <span className="font-bold text-white truncate max-w-[150px]">{item.business?.company_name || "Unknown"}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white font-bold">{item.business?.country_code || "TH"}</span>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Credits Required</span>
                    <span className="font-black text-emerald-400 text-sm">
                      {Number(item.price_credits).toLocaleString()} UNC
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-medium">
                      (Estimated: ${Number(item.estimated_value).toLocaleString()})
                    </span>
                  </div>
                  <button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold py-2.5 px-4 rounded-xl transition">
                    Propose Swap
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE LISTING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-[#020308]/85 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Panel */}
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 md:p-8 shadow-2xl relative space-y-6 z-10">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-white">Create Barter Listing</h3>
                <p className="text-xs text-muted-foreground font-medium">ลงประกาศรายการสินค้าหรือบริการที่พร้อมนำมาแลกเปลี่ยน</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-white text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition"
              >
                ✕
              </button>
            </div>

            {actionData?.error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground text-xs py-3.5 px-4 rounded-xl font-bold">
                ⚠️ {actionData.error}
              </div>
            )}

            <Form method="post" encType="multipart/form-data" ref={formRef} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="title">
                  Listing Title (ชื่อประกาศสินค้า/บริการ)
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="เช่น ข้าวหอมมะลิเกรดเอ 10 ตัน"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                  required
                />
                {actionData?.errors?.title && (
                  <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.title[0]}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="description">
                  Description (รายละเอียดสเปกและเงื่อนไข)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="สเปกสินค้า วิธีการขนส่ง หรือขอบเขตของบริการ..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
                  required
                />
                {actionData?.errors?.description && (
                  <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.description[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="categoryId">
                    Category (หมวดหมู่)
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    className="w-full bg-[#0d111e] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary transition"
                    required
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name.th}
                      </option>
                    ))}
                  </select>
                  {actionData?.errors?.categoryId && (
                    <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.categoryId[0]}</p>
                  )}
                </div>

                {/* Type */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="type">
                    Listing Type (ประเภท)
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="w-full bg-[#0d111e] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary transition"
                    required
                  >
                    <option value="goods">Goods (สินค้า)</option>
                    <option value="service">Service (บริการ)</option>
                  </select>
                  {actionData?.errors?.type && (
                    <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.type[0]}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Estimated Value */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="estimatedValue">
                    Market Value (USD Equivalent)
                  </label>
                  <input
                    id="estimatedValue"
                    name="estimatedValue"
                    type="number"
                    min="1"
                    placeholder="15000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                    required
                  />
                  {actionData?.errors?.estimatedValue && (
                    <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.estimatedValue[0]}</p>
                  )}
                </div>

                {/* Price Credits */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="priceCredits">
                    Barter Price (Unicorn Credits - UNC)
                  </label>
                  <input
                    id="priceCredits"
                    name="priceCredits"
                    type="number"
                    min="1"
                    placeholder="15000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
                    required
                  />
                  {actionData?.errors?.priceCredits && (
                    <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.priceCredits[0]}</p>
                  )}
                </div>
              </div>

              {/* Condition */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="condition">
                  Condition (สภาพสินค้า)
                </label>
                <select
                  id="condition"
                  name="condition"
                  className="w-full bg-[#0d111e] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary transition"
                  required
                >
                  <option value="new">New (ของใหม่/ไม่เคยใช้)</option>
                  <option value="used_like_new">Used - Like New (แกะกล่องใหม่)</option>
                  <option value="used_good">Used - Good (สภาพดี)</option>
                  <option value="used_fair">Used - Fair (พอใช้/ตามสภาพ)</option>
                </select>
                {actionData?.errors?.condition && (
                  <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.condition[0]}</p>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Product Images (รูปภาพสินค้า — สูงสุด 5 รูป, 10MB/รูป)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-white/15 hover:border-primary/50 bg-white/3"
                  }`}
                >
                  {previewUrls.length > 0 ? (
                    <div className="flex gap-2 flex-wrap justify-center">
                      {previewUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`preview-${i}`}
                          className="w-16 h-16 object-cover rounded-lg border border-white/10"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-2xl">🖼️</div>
                      <p className="text-xs text-muted-foreground">
                        ลากวางรูปภาพที่นี่ หรือ{" "}
                        <span className="text-primary font-bold">เลือกไฟล์</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        JPG, PNG, WebP (Max 10MB each)
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="images"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageChange(e.target.files)}
                  />
                </div>
                {previewUrls.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPreviewUrls([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-xs text-muted-foreground hover:text-red-400 transition"
                  >
                    ✕ ลบรูปทั้งหมด
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-3 px-5 rounded-xl transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-black text-xs font-bold py-3 px-5 rounded-xl transition shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating Listing..." : "Create Listing"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
