import { useState, useEffect } from "react";
import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, Form } from "@remix-run/react";
import { requireUserId } from "~/utils/auth.server";
import { supabaseAdmin } from "~/utils/supabase.server";

interface ListingItem {
  id: string;
  title: string;
  estimated_value: number | string;
  business_id: string;
}

interface BusinessInfo {
  id: string;
  company_name: string;
}

interface OfferItem {
  id: string;
  offer_id: string;
  listing_id: string;
  quantity: number;
  credits_value: number | string;
  direction: "sender_to_receiver" | "receiver_to_sender";
  listing: {
    id: string;
    title: string;
    estimated_value: number | string;
  };
}

interface BarterOffer {
  id: string;
  sender_business_id: string;
  receiver_business_id: string;
  status: "pending" | "accepted" | "declined" | "escrowed" | "completed" | "cancelled";
  terms_description: string | null;
  created_at: string;
  sender: BusinessInfo;
  receiver: BusinessInfo;
  items: OfferItem[];
}

interface LoaderData {
  myBusiness: BusinessInfo;
  offers: BarterOffer[];
  myListings: ListingItem[];
  otherBusinesses: BusinessInfo[];
  otherListings: ListingItem[];
  myWallet: {
    balance: number | string;
    hold_balance: number | string;
  } | null;
}

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  // 1. Fetch current user's business
  const { data: myBusiness, error: myBusError } = await supabaseAdmin
    .from("businesses")
    .select("id, company_name")
    .eq("owner_id", userId)
    .single();

  if (myBusError || !myBusiness) {
    throw new Error("ไม่พบข้อมูลร้านค้า กรุณาทำ Onboarding ก่อน");
  }

  // 2. Fetch barter agreements (offers) where user's business is involved
  const { data: offersData } = await supabaseAdmin
    .from("barter_offers")
    .select(`
      *,
      sender:sender_business_id(id, company_name),
      receiver:receiver_business_id(id, company_name),
      items:barter_offer_items(
        *,
        listing:listing_id(id, title, estimated_value)
      )
    `)
    .or(`sender_business_id.eq.${myBusiness.id},receiver_business_id.eq.${myBusiness.id}`)
    .order("created_at", { ascending: false });

  // 3. Fetch listings of this business
  const { data: myListings } = await supabaseAdmin
    .from("listings")
    .select("id, title, estimated_value, business_id")
    .eq("business_id", myBusiness.id)
    .eq("status", "active");

  // 4. Fetch all other businesses in platform
  const { data: otherBusinesses } = await supabaseAdmin
    .from("businesses")
    .select("id, company_name")
    .neq("id", myBusiness.id);

  // 5. Fetch other active listings
  const { data: otherListings } = await supabaseAdmin
    .from("listings")
    .select("id, title, estimated_value, business_id")
    .neq("business_id", myBusiness.id)
    .eq("status", "active");

  // 6. Fetch user's wallet
  const { data: myWallet } = await supabaseAdmin
    .from("wallets")
    .select("balance, hold_balance")
    .eq("business_id", myBusiness.id)
    .single();

  return json<LoaderData>({
    myBusiness,
    offers: (offersData as unknown as BarterOffer[]) || [],
    myListings: myListings || [],
    otherBusinesses: otherBusinesses || [],
    otherListings: otherListings || [],
    myWallet: myWallet || null,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .single();

  if (!business) {
    return json({ error: "ไม่พบข้อมูลร้านค้าของคุณ" }, { status: 400 });
  }

  const myBusinessId = business.id;

  if (intent === "create") {
    const receiverBusinessId = formData.get("receiverBusinessId") as string;
    const termsDescription = formData.get("termsDescription") as string;
    const senderItemsRaw = formData.get("senderItems") as string;
    const receiverItemsRaw = formData.get("receiverItems") as string;

    if (!receiverBusinessId || !senderItemsRaw || !receiverItemsRaw) {
      return json({ error: "ข้อมูลข้อเสนอการแลกเปลี่ยนไม่สมบูรณ์" }, { status: 400 });
    }

    const senderItems = JSON.parse(senderItemsRaw) as { listingId: string; quantity: number; creditsValue: number }[];
    const receiverItems = JSON.parse(receiverItemsRaw) as { listingId: string; quantity: number; creditsValue: number }[];

    if (senderItems.length === 0 && receiverItems.length === 0) {
      return json({ error: "ต้องระบุสินค้าอย่างน้อย 1 รายการในการสร้างดีลแลกเปลี่ยน" }, { status: 400 });
    }

    // Insert new barter offer
    const { data: offer, error: offerError } = await supabaseAdmin
      .from("barter_offers")
      .insert({
        sender_business_id: myBusinessId,
        receiver_business_id: receiverBusinessId,
        status: "pending",
        terms_description: termsDescription || "Standard barter exchange terms.",
      })
      .select()
      .single();

    if (offerError || !offer) {
      return json({ error: `ล้มเหลวในการยื่นข้อเสนอ: ${offerError?.message}` }, { status: 500 });
    }

    const itemsToInsert = [
      ...senderItems.map((item) => ({
        offer_id: offer.id,
        listing_id: item.listingId,
        quantity: item.quantity,
        credits_value: item.creditsValue,
        direction: "sender_to_receiver",
      })),
      ...receiverItems.map((item) => ({
        offer_id: offer.id,
        listing_id: item.listingId,
        quantity: item.quantity,
        credits_value: item.creditsValue,
        direction: "receiver_to_sender",
      })),
    ];

    const { error: itemsError } = await supabaseAdmin
      .from("barter_offer_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // Rollback offer if items insert fails
      await supabaseAdmin.from("barter_offers").delete().eq("id", offer.id);
      return json({ error: `ล้มเหลวในการบันทึกสินค้าแลกเปลี่ยน: ${itemsError.message}` }, { status: 500 });
    }

    return json({ success: true, message: "ยื่นคำเสนอข้อตกลงแลกเปลี่ยนสินค้าสำเร็จ!" });

  } else if (intent === "decline") {
    const offerId = formData.get("offerId") as string;
    const { error } = await supabaseAdmin
      .from("barter_offers")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", offerId)
      .eq("receiver_business_id", myBusinessId);

    if (error) return json({ error: error.message }, { status: 500 });
    return json({ success: true, message: "ปฏิเสธข้อเสนอข้อตกลงแลกเปลี่ยนสินค้าแล้ว" });

  } else if (intent === "cancel") {
    const offerId = formData.get("offerId") as string;
    const { error } = await supabaseAdmin
      .from("barter_offers")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", offerId)
      .eq("sender_business_id", myBusinessId);

    if (error) return json({ error: error.message }, { status: 500 });
    return json({ success: true, message: "ยกเลิกคำเสนอของสัญญาแลกเปลี่ยนแล้ว" });

  } else if (intent === "approve") {
    const offerId = formData.get("offerId") as string;

    // Fetch offer with items
    const { data: offer, error: fetchError } = await supabaseAdmin
      .from("barter_offers")
      .select("*, items:barter_offer_items(*)")
      .eq("id", offerId)
      .single();

    if (fetchError || !offer) {
      return json({ error: "ไม่พบข้อมูลข้อเสนอนี้" }, { status: 404 });
    }

    if (offer.status !== "pending") {
      return json({ error: "ดีลข้อเสนอนี้ไม่พร้อมสำหรับการตอบรับ" }, { status: 400 });
    }

    // Calculate trade value totals
    let senderTotal = 0;
    let receiverTotal = 0;

    for (const item of offer.items) {
      const value = Number(item.credits_value) * Number(item.quantity);
      if (item.direction === "sender_to_receiver") {
        senderTotal += value;
      } else {
        receiverTotal += value;
      }
    }

    const diff = senderTotal - receiverTotal;
    let payerBusinessId = "";
    let payeeBusinessId = "";
    const diffAmount = Math.abs(diff);

    if (diff > 0) {
      // Sender is sending more value. Receiver pays difference
      payerBusinessId = offer.receiver_business_id;
      payeeBusinessId = offer.sender_business_id;
    } else if (diff < 0) {
      // Receiver is sending more value. Sender pays difference
      payerBusinessId = offer.sender_business_id;
      payeeBusinessId = offer.receiver_business_id;
    }

    // Lock Escrow if there is a credit difference
    if (diffAmount > 0) {
      const { data: payerWallet } = await supabaseAdmin
        .from("wallets")
        .select("id, balance, hold_balance")
        .eq("business_id", payerBusinessId)
        .single();

      const { data: payeeWallet } = await supabaseAdmin
        .from("wallets")
        .select("id")
        .eq("business_id", payeeBusinessId)
        .single();

      if (!payerWallet || !payeeWallet) {
        return json({ error: "ไม่พบกระเป๋าเงินของฝ่ายผู้ค้างชำระส่วนต่างค้ำประกัน" }, { status: 400 });
      }

      const balance = Number(payerWallet.balance);
      if (balance < diffAmount) {
        return json({
          error: `กระเป๋าเงินของฝ่ายจ่ายส่วนต่าง (${payerBusinessId === myBusinessId ? "กระเป๋าของคุณ" : "กระเป๋าของคู่ค้า"}) มียอดคงเหลือไม่เพียงพอสำหรับการค้ำประกันจำนวน ${diffAmount.toLocaleString()} UNC`
        }, { status: 400 });
      }

      // Update payer wallet: deduct balance, increase hold_balance
      const { error: walletError } = await supabaseAdmin
        .from("wallets")
        .update({
          balance: balance - diffAmount,
          hold_balance: Number(payerWallet.hold_balance) + diffAmount,
          updated_at: new Date().toISOString()
        })
        .eq("id", payerWallet.id);

      if (walletError) return json({ error: `ล้มเหลวในการหักคะแนน Wallet: ${walletError.message}` }, { status: 500 });

      // Insert escrow
      const { error: escrowError } = await supabaseAdmin
        .from("escrows")
        .insert({
          offer_id: offer.id,
          sender_wallet_id: payerWallet.id,
          receiver_wallet_id: payeeWallet.id,
          amount: diffAmount,
          status: "held",
        });

      if (escrowError) {
        // Simple rollback
        await supabaseAdmin.from("wallets").update({ balance: payerWallet.balance, hold_balance: payerWallet.hold_balance }).eq("id", payerWallet.id);
        return json({ error: `ล้มเหลวในการจัดทำ Escrow: ${escrowError.message}` }, { status: 500 });
      }

      // Insert ledger log
      await supabaseAdmin
        .from("ledger_transactions")
        .insert({
          from_wallet_id: payerWallet.id,
          transaction_type: "escrow_hold",
          amount: diffAmount,
          reference_id: offer.id,
          description: `Locked ${diffAmount.toLocaleString()} UNC for barter agreement #${offer.id}`,
          status: "completed"
        });
    }

    // Set offer status to escrowed
    const { error: offerStatusError } = await supabaseAdmin
      .from("barter_offers")
      .update({ status: "escrowed", updated_at: new Date().toISOString() })
      .eq("id", offer.id);

    if (offerStatusError) return json({ error: offerStatusError.message }, { status: 500 });

    return json({ success: true, message: "อนุมัติข้อตกลงและทำการล็อกแต้ม Escrow ค้ำประกันเรียบร้อย!" });

  } else if (intent === "complete") {
    const offerId = formData.get("offerId") as string;

    const { data: offer } = await supabaseAdmin
      .from("barter_offers")
      .select("*, items:barter_offer_items(*)")
      .eq("id", offerId)
      .single();

    if (!offer || offer.status !== "escrowed") {
      return json({ error: "สัญญานี้ไม่ได้อยู่ในขั้นตอน Escrow" }, { status: 400 });
    }

    // Fetch escrow
    const { data: escrow } = await supabaseAdmin
      .from("escrows")
      .select("*")
      .eq("offer_id", offer.id)
      .eq("status", "held")
      .single();

    if (escrow) {
      const diffAmount = Number(escrow.amount);

      const { data: payerWallet } = await supabaseAdmin
        .from("wallets")
        .select("id, hold_balance")
        .eq("id", escrow.sender_wallet_id)
        .single();

      const { data: payeeWallet } = await supabaseAdmin
        .from("wallets")
        .select("id, balance")
        .eq("id", escrow.receiver_wallet_id)
        .single();

      if (!payerWallet || !payeeWallet) {
        return json({ error: "ไม่พบกระเป๋าเงินคู่สัญญาเพื่อดำเนินการโอนมัดจำ" }, { status: 400 });
      }

      // Deduct from hold_balance, add to payee balance
      await supabaseAdmin
        .from("wallets")
        .update({ hold_balance: Number(payerWallet.hold_balance) - diffAmount, updated_at: new Date().toISOString() })
        .eq("id", payerWallet.id);

      await supabaseAdmin
        .from("wallets")
        .update({ balance: Number(payeeWallet.balance) + diffAmount, updated_at: new Date().toISOString() })
        .eq("id", payeeWallet.id);

      // Update escrow status to released
      await supabaseAdmin
        .from("escrows")
        .update({ status: "released", updated_at: new Date().toISOString() })
        .eq("id", escrow.id);

      // Insert ledger log
      await supabaseAdmin
        .from("ledger_transactions")
        .insert({
          from_wallet_id: payerWallet.id,
          to_wallet_id: payeeWallet.id,
          transaction_type: "escrow_release",
          amount: diffAmount,
          reference_id: offer.id,
          description: `Released escrow lock of ${diffAmount.toLocaleString()} UNC to partner for barter agreement #${offer.id}`,
          status: "completed"
        });
    }

    // Mark offer completed
    const { error: offerStatusError } = await supabaseAdmin
      .from("barter_offers")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", offer.id);

    if (offerStatusError) return json({ error: offerStatusError.message }, { status: 500 });

    return json({ success: true, message: "ยืนยันการรับสินค้าเสร็จสิ้น เครดิตได้รับการโอนถ่ายสมบูรณ์!" });
  }

  return json({ error: "ไม่พบคาสั่งการทำงาน" }, { status: 400 });
};

export default function Barter() {
  const { myBusiness, offers, myListings, otherBusinesses, otherListings, myWallet } = useLoaderData<LoaderData>();
  const actionData = useActionData<{ success?: boolean; error?: string; message?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [activeTab, setActiveTab] = useState<"active" | "completed" | "cancelled">("active");
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [senderOfferItems, setSenderOfferItems] = useState<{ listingId: string; quantity: number; creditsValue: number }[]>([]);
  const [receiverOfferItems, setReceiverOfferItems] = useState<{ listingId: string; quantity: number; creditsValue: number }[]>([]);
  const [terms, setTerms] = useState("");

  useEffect(() => {
    if (actionData?.success) {
      setShowBuilder(false);
      setSelectedPartner("");
      setSenderOfferItems([]);
      setReceiverOfferItems([]);
      setTerms("");
    }
  }, [actionData]);

  // Calculate swap value preview
  const senderTotal = senderOfferItems.reduce((acc, item) => acc + (item.quantity * item.creditsValue), 0);
  const receiverTotal = receiverOfferItems.reduce((acc, item) => acc + (item.quantity * item.creditsValue), 0);
  const creditDiff = senderTotal - receiverTotal;

  const handleAddSenderItem = (listingId: string, value: number) => {
    if (senderOfferItems.find(i => i.listingId === listingId)) return;
    setSenderOfferItems([...senderOfferItems, { listingId, quantity: 1, creditsValue: value }]);
  };

  const handleAddReceiverItem = (listingId: string, value: number) => {
    if (receiverOfferItems.find(i => i.listingId === listingId)) return;
    setReceiverOfferItems([...receiverOfferItems, { listingId, quantity: 1, creditsValue: value }]);
  };

  const handleUpdateSenderQty = (listingId: string, qty: number) => {
    setSenderOfferItems(senderOfferItems.map(i => i.listingId === listingId ? { ...i, quantity: qty } : i));
  };

  const handleUpdateReceiverQty = (listingId: string, qty: number) => {
    setReceiverOfferItems(receiverOfferItems.map(i => i.listingId === listingId ? { ...i, quantity: qty } : i));
  };

  const handleRemoveSenderItem = (listingId: string) => {
    setSenderOfferItems(senderOfferItems.filter(i => i.listingId !== listingId));
  };

  const handleRemoveReceiverItem = (listingId: string) => {
    setReceiverOfferItems(receiverOfferItems.filter(i => i.listingId !== listingId));
  };

  const filteredOffers = offers.filter(offer => {
    if (activeTab === "completed") return offer.status === "completed";
    if (activeTab === "cancelled") return offer.status === "cancelled" || offer.status === "declined";
    return offer.status === "pending" || offer.status === "escrowed";
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Barter Contracts & Swaps</h2>
          <p className="text-xs text-muted-foreground">
            บริหารจัดการข้อเสนอสัญญาแลกเปลี่ยน ล็อกและปล่อยเครดิตค้ำประกันผ่านระบบ Escrow ระหว่างองค์กร
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="bg-primary hover:bg-primary/90 text-black text-xs font-bold py-3 px-5 rounded-xl transition shadow-lg shadow-primary/20 flex-shrink-0"
        >
          {showBuilder ? "Cancel Builder" : "➕ Create Swap Contract"}
        </button>
      </div>

      {actionData?.message && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs py-3.5 px-4 rounded-xl font-bold">
          ✓ {actionData.message}
        </div>
      )}

      {actionData?.error && (
        <div className="bg-destructive/10 border border-destructive/25 text-destructive-foreground text-xs py-3.5 px-4 rounded-xl font-bold">
          ⚠️ {actionData.error}
        </div>
      )}

      {/* INTERACTIVE SWAP BUILDER */}
      {showBuilder && (
        <div className="glass-card p-6 rounded-3xl border border-primary/20 relative space-y-6 animate-scaleUp">
          <h3 className="text-base font-extrabold text-white">🛠️ Smart Barter Contract Builder</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Step 1: Select Partner */}
            <div className="md:col-span-4 space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">Select Partner Business</label>
              <select
                value={selectedPartner}
                onChange={(e) => {
                  setSelectedPartner(e.target.value);
                  setReceiverOfferItems([]);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary transition"
              >
                <option value="" className="bg-background">-- Select B2B Partner --</option>
                {otherBusinesses.map((b) => (
                  <option key={b.id} value={b.id} className="bg-background">{b.company_name}</option>
                ))}
              </select>

              <div className="pt-4 space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">Contract Terms & Conditions</label>
                <textarea
                  placeholder="Terms, logistics and delivery agreements..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
                />
              </div>
            </div>

            {/* Step 2: Select Items */}
            {selectedPartner ? (
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Your Items */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-primary">📤 Your Items (To Give)</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                    {myListings.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddSenderItem(item.id, Number(item.estimated_value))}
                        className="w-full text-left bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-xs flex justify-between items-center transition border border-white/5"
                      >
                        <span className="truncate font-semibold text-white">{item.title}</span>
                        <span className="font-bold text-emerald-400 shrink-0 ml-2">{Number(item.estimated_value).toLocaleString()} UNC</span>
                      </button>
                    ))}
                    {myListings.length === 0 && <p className="text-[10px] text-muted-foreground font-medium">คุณไม่มีสินค้าที่ Active อยู่ในระบบ</p>}
                  </div>

                  {senderOfferItems.map((item) => {
                    const matched = myListings.find(l => l.id === item.listingId);
                    return (
                      <div key={item.listingId} className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center text-xs">
                        <div className="truncate pr-2">
                          <span className="font-bold text-white block truncate">{matched?.title}</span>
                          <span className="text-[10px] text-muted-foreground">{item.creditsValue} UNC each</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateSenderQty(item.listingId, Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-12 bg-[#0b0f19] border border-white/10 text-center rounded py-1 font-bold text-white text-xs"
                          />
                          <button type="button" onClick={() => handleRemoveSenderItem(item.listingId)} className="text-red-400 font-bold hover:text-red-300">✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Partner Items */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-secondary">📥 Partner Items (To Receive)</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                    {otherListings.filter(i => i.business_id === selectedPartner).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddReceiverItem(item.id, Number(item.estimated_value))}
                        className="w-full text-left bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-xs flex justify-between items-center transition border border-white/5"
                      >
                        <span className="truncate font-semibold text-white">{item.title}</span>
                        <span className="font-bold text-emerald-400 shrink-0 ml-2">{Number(item.estimated_value).toLocaleString()} UNC</span>
                      </button>
                    ))}
                    {otherListings.filter(i => i.business_id === selectedPartner).length === 0 && (
                      <p className="text-[10px] text-muted-foreground font-medium">คู่ค้ารายนี้ไม่มีสินค้าที่พร้อมแลกเปลี่ยน</p>
                    )}
                  </div>

                  {receiverOfferItems.map((item) => {
                    const matched = otherListings.find(l => l.id === item.listingId);
                    return (
                      <div key={item.listingId} className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center text-xs">
                        <div className="truncate pr-2">
                          <span className="font-bold text-white block truncate">{matched?.title}</span>
                          <span className="text-[10px] text-muted-foreground">{item.creditsValue} UNC each</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateReceiverQty(item.listingId, Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-12 bg-[#0b0f19] border border-white/10 text-center rounded py-1 font-bold text-white text-xs"
                          />
                          <button type="button" onClick={() => handleRemoveReceiverItem(item.listingId)} className="text-red-400 font-bold hover:text-red-300">✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="md:col-span-8 border border-dashed border-white/10 rounded-2xl flex items-center justify-center py-12 text-muted-foreground text-xs font-semibold">
                กรุณาเลือกบริษัทคู่ค้าด้านซ้ายก่อน
              </div>
            )}
          </div>

          {selectedPartner && (
            <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground font-bold">Ledger Balance Reconciliation Preview:</span>
                <p className="font-extrabold text-sm text-white">
                  มูลค่าสินค้าที่คุณส่งออก: <span className="text-primary">{senderTotal.toLocaleString()} UNC</span> | 
                  มูลค่าที่คุณได้รับเข้า: <span className="text-secondary">{receiverTotal.toLocaleString()} UNC</span>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`font-black uppercase py-0.5 px-2 rounded ${creditDiff >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {creditDiff >= 0 ? "You Receive Credits" : "You Must Pay Credits"}
                  </span>
                  <span className="text-white font-black text-sm">{Math.abs(creditDiff).toLocaleString()} UNC</span>
                </div>
                {creditDiff < 0 && (
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    (คุณต้องมียอดแต้มกระเป๋าคงเหลือเพียงพอกลุ่มนี้สำหรับจ่ายค่าส่วนต่าง ตอนที่คู่สัญญากดยอมรับสัญญา)
                  </p>
                )}
              </div>

              <Form method="post" className="flex-shrink-0">
                <input type="hidden" name="intent" value="create" />
                <input type="hidden" name="receiverBusinessId" value={selectedPartner} />
                <input type="hidden" name="termsDescription" value={terms} />
                <input type="hidden" name="senderItems" value={JSON.stringify(senderOfferItems)} />
                <input type="hidden" name="receiverItems" value={JSON.stringify(receiverOfferItems)} />

                <button
                  type="submit"
                  disabled={isSubmitting || (senderOfferItems.length === 0 && receiverOfferItems.length === 0)}
                  className="bg-primary hover:bg-primary/90 text-black py-3 px-5 rounded-xl font-bold transition shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting Contract..." : "Submit Exchange Proposal"}
                </button>
              </Form>
            </div>
          )}
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        {(["active", "completed", "cancelled"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-bold py-2 px-4 rounded-xl border transition uppercase ${
              activeTab === tab
                ? "bg-primary/10 border-primary/20 text-primary"
                : "border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            {tab} Contracts ({offers.filter(o => {
              if (tab === "completed") return o.status === "completed";
              if (tab === "cancelled") return o.status === "cancelled" || o.status === "declined";
              return o.status === "pending" || o.status === "escrowed";
            }).length})
          </button>
        ))}
      </div>

      {/* CONTRACT LISTINGS */}
      <div className="space-y-6">
        {filteredOffers.map((offer) => {
          const isSender = offer.sender_business_id === myBusiness.id;
          const partnerName = isSender ? offer.receiver.company_name : offer.sender.company_name;

          // Calculate values
          let senderVal = 0;
          let receiverVal = 0;
          for (const item of offer.items) {
            const v = Number(item.credits_value) * Number(item.quantity);
            if (item.direction === "sender_to_receiver") senderVal += v;
            else receiverVal += v;
          }

          const diffVal = senderVal - receiverVal;
          const absoluteDiff = Math.abs(diffVal);
          const payerIsMe = (diffVal > 0 && !isSender) || (diffVal < 0 && isSender);

          return (
            <div key={offer.id} className="glass-card p-6 rounded-3xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
              
              <div className="flex justify-between items-center flex-wrap gap-2 z-10 relative">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
                    Contract #{offer.id.substring(0, 8)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Partner: <span className="font-bold text-white">{partnerName}</span> | {new Date(offer.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                  offer.status === "completed"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : offer.status === "escrowed"
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse"
                    : offer.status === "declined" || offer.status === "cancelled"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  {offer.status}
                </span>
              </div>

              {/* Terms */}
              {offer.terms_description && (
                <p className="text-xs text-muted-foreground bg-white/5 border border-white/10 p-3 rounded-xl">
                  📄 <span className="font-bold text-white">Terms:</span> {offer.terms_description}
                </p>
              )}

              {/* Trade Items Flow Grid */}
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Sender to Receiver (Initiator Output) */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-primary flex items-center gap-1">
                      📤 Sender Output ({offer.sender.company_name})
                    </h4>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {offer.items.filter(i => i.direction === "sender_to_receiver").map((item) => (
                        <div key={item.id} className="bg-[#0b0f19] p-3 rounded-xl flex justify-between items-center border border-white/5 gap-2">
                          <span className="text-white font-semibold truncate">{item.listing.title}</span>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-emerald-400 block">{(Number(item.credits_value) * item.quantity).toLocaleString()} UNC</span>
                            <span className="text-[9px] text-muted-foreground">{item.quantity} x {Number(item.credits_value).toLocaleString()} UNC</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Receiver to Sender */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-secondary flex items-center gap-1">
                      📥 Receiver Output ({offer.receiver.company_name})
                    </h4>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {offer.items.filter(i => i.direction === "receiver_to_sender").map((item) => (
                        <div key={item.id} className="bg-[#0b0f19] p-3 rounded-xl flex justify-between items-center border border-white/5 gap-2">
                          <span className="text-white font-semibold truncate">{item.listing.title}</span>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-emerald-400 block">{(Number(item.credits_value) * item.quantity).toLocaleString()} UNC</span>
                            <span className="text-[9px] text-muted-foreground">{item.quantity} x {Number(item.credits_value).toLocaleString()} UNC</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ledger calculations and Actions */}
                <div className="border-t border-white/5 pt-3.5 flex flex-col md:flex-row justify-between md:items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-bold">
                      Ledger Valuation: <span className="text-primary">{senderVal.toLocaleString()} UNC</span> vs <span className="text-secondary">{receiverVal.toLocaleString()} UNC</span>
                    </p>
                    <p className="font-extrabold text-white">
                      Balance Reconciliation: 
                      {absoluteDiff > 0 ? (
                        <span className="ml-1 text-emerald-400">
                          {payerIsMe ? "คุณ" : "คู่ค้า"} ค้างจ่ายค่าส่วนต่าง {absoluteDiff.toLocaleString()} UNC
                        </span>
                      ) : (
                        <span className="ml-1 text-white">
                          แลกเปลี่ยนเสมอภาค (ไม่มีส่วนต่างคะแนนค้างจ่าย)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* ACTIONS FLOW */}
                  <div className="flex gap-2 shrink-0">
                    {offer.status === "pending" && (
                      <>
                        {isSender ? (
                          <Form method="post">
                            <input type="hidden" name="intent" value="cancel" />
                            <input type="hidden" name="offerId" value={offer.id} />
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 px-4.5 rounded-xl font-bold transition disabled:opacity-50"
                            >
                              Cancel Contract Offer
                            </button>
                          </Form>
                        ) : (
                          <>
                            <Form method="post">
                              <input type="hidden" name="intent" value="decline" />
                              <input type="hidden" name="offerId" value={offer.id} />
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2.5 px-4.5 rounded-xl font-bold transition disabled:opacity-50"
                              >
                                Decline Swap
                              </button>
                            </Form>
                            <Form method="post">
                              <input type="hidden" name="intent" value="approve" />
                              <input type="hidden" name="offerId" value={offer.id} />
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary hover:bg-primary/90 text-black py-2.5 px-4.5 rounded-xl font-bold transition shadow-lg shadow-primary/20 disabled:opacity-50"
                              >
                                Approve & Lock Escrow
                              </button>
                            </Form>
                          </>
                        )}
                      </>
                    )}

                    {offer.status === "escrowed" && (
                      <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/25 p-2 rounded-xl">
                        <span className="text-[10px] text-blue-400 font-bold">🔒 Escrow Active</span>
                        
                        {/* Only the beneficiary of the escrow difference or sender can complete, commonly either side can mark received */}
                        <Form method="post">
                          <input type="hidden" name="intent" value="complete" />
                          <input type="hidden" name="offerId" value={offer.id} />
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold py-2 px-3 rounded-lg transition disabled:opacity-50"
                          >
                            {isSubmitting ? "Completing..." : "Confirm Delivery (Release Escrow)"}
                          </button>
                        </Form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredOffers.length === 0 && (
          <div className="text-center py-16 glass-card rounded-2xl text-muted-foreground text-xs font-semibold">
            ไม่มีสัญญาแลกเปลี่ยนในหมวดหมู่นี้
          </div>
        )}
      </div>
    </div>
  );
}

