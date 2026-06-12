import { useState } from "react";
import { json, type LoaderFunction, type ActionFunction } from "@remix-run/cloudflare";
import { useLoaderData, useActionData, useNavigation, Form } from "@remix-run/react";
import { requireUserId } from "~/utils/auth.server";
import { supabaseAdmin } from "~/utils/supabase.server";
import { sendEscrowNotification } from "~/utils/resend.server";
import { sendEscrowAlert, notifyAdminDispute } from "~/utils/line.server";

interface EscrowRecord {
  id: string;
  offer_id: string;
  sender_wallet_id: string;
  receiver_wallet_id: string;
  amount: number | string;
  status: "held" | "released" | "refunded" | "disputed";
  dispute_reason: string | null;
  created_at: string;
  offer: {
    id: string;
    status: string;
    sender_business_id: string;
    receiver_business_id: string;
    sender: { company_name: string };
    receiver: { company_name: string };
  };
}

interface SettlementRecord {
  id: string;
  payment_gateway: "stripe" | "wise";
  gateway_transaction_id: string;
  amount: number | string;
  currency: string;
  direction: "inbound" | "outbound";
  status: "pending" | "completed" | "failed" | "refunded";
  created_at: string;
}

interface LoaderData {
  myBusinessId: string;
  myWalletId: string;
  escrows: EscrowRecord[];
  settlements: SettlementRecord[];
  totalHeld: number;
}

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  // 1. Fetch current business
  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .single();

  if (!business) {
    throw new Error("ไม่พบข้อมูลร้านค้าของคุณ");
  }

  // 2. Fetch current wallet
  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("id")
    .eq("business_id", business.id)
    .single();

  if (!wallet) {
    throw new Error("ไม่พบกระเป๋าเงินของคุณ");
  }

  // 3. Fetch escrows where wallet is sender or receiver
  const { data: escrowsData } = await supabaseAdmin
    .from("escrows")
    .select(`
      *,
      offer:offer_id(
        id,
        status,
        sender_business_id,
        receiver_business_id,
        sender:sender_business_id(company_name),
        receiver:receiver_business_id(company_name)
      )
    `)
    .or(`sender_wallet_id.eq.${wallet.id},receiver_wallet_id.eq.${wallet.id}`)
    .order("created_at", { ascending: false });

  // 4. Fetch settlements for this business
  const { data: settlementsData } = await supabaseAdmin
    .from("settlements")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  // Calculate total held amount
  const escrowsList = (escrowsData as unknown as EscrowRecord[]) || [];
  const totalHeld = escrowsList
    .filter(e => e.status === "held" || e.status === "disputed")
    .reduce((acc, e) => {
      // Only count as held if we are the sender (since it was deducted from our balance)
      if (e.sender_wallet_id === wallet.id) {
        return acc + Number(e.amount);
      }
      return acc;
    }, 0);

  return json<LoaderData>({
    myBusinessId: business.id,
    myWalletId: wallet.id,
    escrows: escrowsList,
    settlements: (settlementsData as unknown as SettlementRecord[]) || [],
    totalHeld,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const escrowId = formData.get("escrowId") as string;

  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .single();

  if (!business) {
    return json({ error: "ไม่พบข้อมูลร้านค้าของคุณ" }, { status: 400 });
  }

  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("id")
    .eq("business_id", business.id)
    .single();

  if (!wallet || !escrowId) {
    return json({ error: "ข้อมูลธุรกรรมไม่ครบถ้วน" }, { status: 400 });
  }

  // Fetch target escrow
  const { data: escrow } = await supabaseAdmin
    .from("escrows")
    .select("*")
    .eq("id", escrowId)
    .single();

  if (!escrow) {
    return json({ error: "ไม่พบข้อมูลค้ำประกัน Escrow" }, { status: 404 });
  }

  if (intent === "release") {
    if (escrow.status !== "held" && escrow.status !== "disputed") {
      return json({ error: "ค้ำประกันนี้ได้รับการปลดล็อกหรือคืนไปแล้ว" }, { status: 400 });
    }

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
      return json({ error: "ไม่พบกระเป๋าเงินคู่สัญญาเพื่อทำรายการ" }, { status: 400 });
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

    // Update barter offer status to completed
    await supabaseAdmin
      .from("barter_offers")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", escrow.offer_id);

    // Insert ledger log
    await supabaseAdmin
      .from("ledger_transactions")
      .insert({
        from_wallet_id: payerWallet.id,
        to_wallet_id: payeeWallet.id,
        transaction_type: "escrow_release",
        amount: diffAmount,
        reference_id: escrow.offer_id,
        description: `Released escrow from dashboard for barter contract #${escrow.offer_id}`,
        status: "completed"
      });

    // Notify parties via Email + LINE (non-blocking)
    const { data: ownerBusiness } = await supabaseAdmin
      .from("businesses")
      .select("owner_id")
      .eq("id", escrow.offer?.receiver_business_id)
      .single();
    const { data: ownerUser } = ownerBusiness?.owner_id
      ? await supabaseAdmin.auth.admin.getUserById(ownerBusiness.owner_id)
      : { data: null };

    Promise.all([
      sendEscrowNotification(
        ownerUser?.user?.email ?? "",
        escrowId,
        "completed",
        "Barter Partner",
        Number(escrow.amount)
      ).catch((e) => console.error("[Escrow] Release email failed:", e)),
      sendEscrowAlert(ownerBusiness?.owner_id ?? "", escrowId, "completed", Number(escrow.amount))
        .catch((e) => console.error("[Escrow] Release LINE failed:", e)),
    ]);

    return json({ success: true, message: "ทำการอนุมัติส่งมอบสินค้าและปล่อยเครดิต Escrow สำเร็จ!" });

  } else if (intent === "refund") {
    // Escrow refund logic (Only allowed if barter offer is declined or cancelled, or sender wallet is ours and it's held)
    const { data: offer } = await supabaseAdmin
      .from("barter_offers")
      .select("status")
      .eq("id", escrow.offer_id)
      .single();

    if (!offer) {
      return json({ error: "ไม่พบสัญญาร่วมที่เกี่ยวข้อง" }, { status: 400 });
    }

    // Refund is only valid if barter offer is NOT completed/escrowed-active, or if it is cancelled/declined
    if (offer.status !== "cancelled" && offer.status !== "declined" && offer.status !== "pending") {
      return json({ error: "สัญญานี้อยู่ในสถานะที่มีผลผูกพัน ไม่สามารถทำเรื่องคืนเงินประกันได้โดยตรง" }, { status: 400 });
    }

    const diffAmount = Number(escrow.amount);

    const { data: payerWallet } = await supabaseAdmin
      .from("wallets")
      .select("id, balance, hold_balance")
      .eq("id", escrow.sender_wallet_id)
      .single();

    if (!payerWallet) {
      return json({ error: "ไม่พบกระเป๋าเงินผู้ฝากค้ำประกัน" }, { status: 400 });
    }

    // Return hold_balance to balance
    await supabaseAdmin
      .from("wallets")
      .update({
        hold_balance: Number(payerWallet.hold_balance) - diffAmount,
        balance: Number(payerWallet.balance) + diffAmount,
        updated_at: new Date().toISOString()
      })
      .eq("id", payerWallet.id);

    // Update escrow to refunded
    await supabaseAdmin
      .from("escrows")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", escrow.id);

    // Insert ledger log
    await supabaseAdmin
      .from("ledger_transactions")
      .insert({
        to_wallet_id: payerWallet.id,
        transaction_type: "topup", // Refund behaves like a topup/return to wallet balance
        amount: diffAmount,
        reference_id: escrow.offer_id,
        description: `Escrow refunded back to balance for barter contract #${escrow.offer_id}`,
        status: "completed"
      });

    return json({ success: true, message: "คืนเครดิตค้ำประกันกลับเข้าสู่ยอดคงเหลือหลักสำเร็จ!" });

  } else if (intent === "dispute") {
    const disputeReason = formData.get("disputeReason") as string;
    if (!disputeReason) {
      return json({ error: "กรุณาระบุเหตุผลการโต้แย้งข้อพิพาท" }, { status: 400 });
    }

    // Set escrow status to disputed
    const { error: disputeError } = await supabaseAdmin
      .from("escrows")
      .update({
        status: "disputed",
        dispute_reason: disputeReason,
        updated_at: new Date().toISOString()
      })
      .eq("id", escrow.id);

    if (disputeError) return json({ error: disputeError.message }, { status: 500 });

    // Notify Admin via LINE
    notifyAdminDispute(escrowId, disputeReason).catch((e) =>
      console.error("[Escrow] Dispute LINE notify failed:", e)
    );

    return json({ success: true, message: "ส่งข้อโต้แย้งข้อพิพาทไปยังฝ่ายดูแลระบบ (Admin) เรียบร้อย!" });
  }

  return json({ error: "ไม่พบประเภทรายการ" }, { status: 400 });
};

export default function Escrows() {
  const { escrows, settlements, totalHeld, myWalletId } = useLoaderData<LoaderData>();
  const actionData = useActionData<{ success?: boolean; error?: string; message?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [activeTab, setActiveTab] = useState<"escrows" | "settlements">("escrows");
  const [disputeEscrowId, setDisputeEscrowId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const getEscrowStatusBadge = (status: string) => {
    switch (status) {
      case "held":
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase animate-pulse">Held (Locked)</span>;
      case "released":
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Released</span>;
      case "refunded":
        return <span className="bg-white/5 text-muted-foreground border border-white/10 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Refunded</span>;
      case "disputed":
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Disputed</span>;
      default:
        return status;
    }
  };

  const getSettlementStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Completed</span>;
      case "pending":
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase animate-pulse">Processing</span>;
      case "failed":
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Failed</span>;
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Upper overview section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 justify-between items-center gap-6 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">🛡️ Escrow & Settlement Engine</h2>
          <p className="text-xs text-muted-foreground font-medium">
            ค้ำประกันข้อตกลงแลกเปลี่ยน ตรวจสอบยอดเงินประกันที่ติดพัน และบันทึกประวัติธุรกรรมสกุลเงินเฟียต (USD/THB)
          </p>
        </div>
        
        {/* Quick balance card */}
        <div className="glass-card p-5 rounded-2xl flex justify-between items-center bg-white/5 border border-white/10 max-w-sm sm:justify-self-end w-full">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block">Your Locked Escrows</span>
            <span className="text-2xl font-black text-amber-400 tracking-wider">
              {totalHeld.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-bold text-white">UNC</span>
            </span>
          </div>
          <div className="text-4xl">🛡️</div>
        </div>
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

      {/* FILTER NAVIGATION TABS */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("escrows")}
          className={`text-xs font-bold py-2.5 px-5 rounded-xl border transition uppercase ${
            activeTab === "escrows"
              ? "bg-primary/10 border-primary/20 text-primary"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          🛡️ Escrow Accounts ({escrows.length})
        </button>
        <button
          onClick={() => setActiveTab("settlements")}
          className={`text-xs font-bold py-2.5 px-5 rounded-xl border transition uppercase ${
            activeTab === "settlements"
              ? "bg-primary/10 border-primary/20 text-primary"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          💵 Settlements ({settlements.length})
        </button>
      </div>

      {/* MAIN DATA PANELS */}
      <div className="glass-card p-6 rounded-3xl">
        {activeTab === "escrows" ? (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white">🔒 Escrows Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 pb-2 text-muted-foreground font-black">
                    <th className="py-3 px-2">Contract / Partners</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2">Escrow Value</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {escrows.map((esc) => {
                    const isPayer = esc.sender_wallet_id === myWalletId;
                    const partnerName = isPayer ? esc.offer.receiver.company_name : esc.offer.sender.company_name;
                    const amountNum = Number(esc.amount);

                    return (
                      <tr key={esc.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition">
                        <td className="py-4 px-2">
                          <div className="font-bold text-white">Contract #{esc.offer_id.substring(0, 8)}</div>
                          <div className="text-[10px] text-muted-foreground font-semibold pt-0.5">
                            Partner: {partnerName} | Created: {new Date(esc.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isPayer ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            {isPayer ? "Payer (จ่ายส่วนต่าง)" : "Receiver (รับส่วนต่าง)"}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <span className="font-extrabold text-white text-xs">{amountNum.toLocaleString(undefined, { minimumFractionDigits: 2 })} UNC</span>
                          <div className="text-[9px] text-muted-foreground">${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</div>
                        </td>
                        <td className="py-4 px-2">
                          {getEscrowStatusBadge(esc.status)}
                          {esc.status === "disputed" && esc.dispute_reason && (
                            <p className="text-[9px] text-red-300 font-semibold pt-1 truncate max-w-[150px]">
                              Reason: {esc.dispute_reason}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex justify-end gap-1.5">
                            {(esc.status === "held" || esc.status === "disputed") && (
                              <>
                                {/* Release Escrow: usually receivers can trigger delivery, but in B2B either can confirm */}
                                <Form method="post" className="inline">
                                  <input type="hidden" name="intent" value="release" />
                                  <input type="hidden" name="escrowId" value={esc.id} />
                                  <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition"
                                  >
                                    Release
                                  </button>
                                </Form>
                                
                                {esc.status !== "disputed" && (
                                  <button
                                    type="button"
                                    onClick={() => setDisputeEscrowId(esc.id)}
                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition"
                                  >
                                    Dispute
                                  </button>
                                )}
                              </>
                            )}

                            {esc.status === "held" && (esc.offer.status === "cancelled" || esc.offer.status === "declined") && (
                              <Form method="post" className="inline">
                                <input type="hidden" name="intent" value="refund" />
                                <input type="hidden" name="escrowId" value={esc.id} />
                                <button
                                  type="submit"
                                  disabled={isSubmitting}
                                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition"
                                >
                                  Refund
                                </button>
                              </Form>
                            )}
                            
                            {esc.status !== "held" && esc.status !== "disputed" && (
                              <span className="text-muted-foreground text-[10px] font-semibold pr-2">No actions</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {escrows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground text-xs font-semibold">
                        ไม่มีประวัติบัญชีค้ำประกัน Escrow ที่ผูกมัดกับคุณ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white">💵 Settlements History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 pb-2 text-muted-foreground font-black">
                    <th className="py-3 px-2">Transaction Hash / Gateway</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Fiat Amount</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((set) => {
                    const amountVal = Number(set.amount);
                    const isDeposit = set.direction === "inbound";

                    return (
                      <tr key={set.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition">
                        <td className="py-4 px-2">
                          <div className="font-bold text-white uppercase">{set.payment_gateway} Settlement</div>
                          <div className="text-[10px] text-muted-foreground font-semibold pt-0.5 truncate max-w-[200px]">
                            ID: {set.gateway_transaction_id}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isDeposit ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {isDeposit ? "Stripe Deposit" : "Wise Withdrawal"}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`font-extrabold text-xs ${isDeposit ? "text-emerald-400" : "text-blue-400"}`}>
                            {isDeposit ? "+" : "-"}${amountVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {set.currency}
                          </span>
                          <div className="text-[9px] text-muted-foreground">
                            {isDeposit ? "+" : "-"}{amountVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} UNC
                          </div>
                        </td>
                        <td className="py-4 px-2 text-muted-foreground">
                          {new Date(set.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-2">
                          {getSettlementStatusBadge(set.status)}
                        </td>
                      </tr>
                    );
                  })}
                  {settlements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground text-xs font-semibold">
                        ไม่มีประวัติการทำ Settlement ฝาก/ถอนของร้านค้าคุณ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* DISPUTE DIALOG MODAL */}
      {disputeEscrowId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#020308]/85 backdrop-blur-sm"
            onClick={() => setDisputeEscrowId(null)}
          />
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl relative space-y-5 z-10 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-extrabold text-white">⚠️ Raise Escrow Dispute</h3>
              <button
                type="button"
                onClick={() => setDisputeEscrowId(null)}
                className="text-muted-foreground hover:text-white text-base font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition"
              >
                ✕
              </button>
            </div>
            
            <Form method="post" onSubmit={() => setDisputeEscrowId(null)} className="space-y-4">
              <input type="hidden" name="intent" value="dispute" />
              <input type="hidden" name="escrowId" value={disputeEscrowId} />
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="disputeReason">
                  เหตุผลในการเปิดข้อพิพาท / Dispute Reason
                </label>
                <textarea
                  id="disputeReason"
                  name="disputeReason"
                  placeholder="เช่น คู่สัญญาไม่ยอมส่งของ, สินค้าชำรุดเสียหาย, หรือบริการไม่เป็นไปตามข้อตกลง..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full h-28 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setDisputeEscrowId(null)}
                  className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !disputeReason}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting Dispute..." : "Confirm & Raise Dispute"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
