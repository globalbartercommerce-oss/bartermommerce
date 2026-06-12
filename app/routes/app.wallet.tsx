import { useState, useRef, useEffect } from "react";
import { json, type LoaderFunction, type ActionFunction } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, Form } from "@remix-run/react";
import { requireUserId } from "~/utils/auth.server";
import { supabaseAdmin } from "~/utils/supabase.server";
import { z } from "zod";

interface LedgerLog {
  id: string;
  from_wallet_id: string | null;
  to_wallet_id: string | null;
  transaction_type: 'barter_payment' | 'barter_fee' | 'escrow_hold' | 'escrow_release' | 'topup' | 'withdraw';
  amount: number | string;
  reference_id: string | null;
  description: string | null;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

interface WalletData {
  id: string;
  balance: number | string;
  hold_balance: number | string;
  currency: string;
}

interface LoaderData {
  wallet: WalletData;
  ledgerHistory: LedgerLog[];
  businessId: string;
}

const transactionSchema = z.object({
  actionType: z.enum(["deposit", "withdraw"]),
  amount: z.preprocess(
    (val) => Number(val),
    z.number({ message: "กรุณาระบุจำนวนเงินที่ถูกต้อง" }).positive({ message: "จำนวนเงินต้องมากกว่า 0" })
  ),
});

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  // 1. Fetch user's business profile
  const { data: business, error: busError } = await supabaseAdmin
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .single();

  if (busError || !business) {
    throw new Error("ไม่พบข้อมูลร้านค้า กรุณาทำ Onboarding ก่อน");
  }

  // 2. Fetch or create wallet
  let { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("*")
    .eq("business_id", business.id)
    .single();

  if (!wallet) {
    const { data: newWallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .insert({ business_id: business.id, balance: 0.00, hold_balance: 0.00, currency: "UNC" })
      .select("*")
      .single();
    if (!walletError && newWallet) {
      wallet = newWallet;
    }
  }

  // 3. Fetch ledger transactions
  const { data: transactions } = await supabaseAdmin
    .from("ledger_transactions")
    .select("*")
    .or(`from_wallet_id.eq.${wallet.id},to_wallet_id.eq.${wallet.id}`)
    .order("created_at", { ascending: false });

  return json<LoaderData>({
    wallet: wallet || { id: "", balance: 0.00, hold_balance: 0.00, currency: "UNC" },
    ledgerHistory: (transactions as unknown as LedgerLog[]) || [],
    businessId: business.id,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  const rawData = {
    actionType: formData.get("actionType"),
    amount: formData.get("amount"),
  };

  // Validate form payload
  const result = transactionSchema.safeParse(rawData);
  if (!result.success) {
    return json({ 
      success: false, 
      errors: result.error.flatten().fieldErrors 
    }, { status: 400 });
  }

  const { actionType, amount } = result.data;

  try {
    // 1. Fetch current business and wallet
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .single();

    if (!business) {
      throw new Error("ไม่พบข้อมูลร้านค้า");
    }

    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("id, balance")
      .eq("business_id", business.id)
      .single();

    if (!wallet) {
      throw new Error("ไม่พบกระเป๋าเงินของคุณ");
    }

    const currentBalance = Number(wallet.balance);

    if (actionType === "deposit") {
      const newBalance = currentBalance + amount;
      
      // Update wallet balance
      const { error: updateError } = await supabaseAdmin
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", wallet.id);

      if (updateError) throw updateError;

      // Log transaction
      const { error: logError } = await supabaseAdmin
        .from("ledger_transactions")
        .insert({
          to_wallet_id: wallet.id,
          transaction_type: "topup",
          amount: amount,
          description: "Stripe deposit top-up",
          status: "completed",
        });

      if (logError) throw logError;

      return json({ success: true, message: `ทำการฝากเงินจำนวน ${amount.toLocaleString()} UNC สำเร็จ!` });

    } else {
      // Withdrawal check for overdraft
      if (currentBalance < amount) {
        return json({
          success: false,
          error: "ยอดเงินคงเหลือของคุณไม่เพียงพอสำหรับการทำรายการถอนเงินนี้ (Insufficient funds)"
        }, { status: 400 });
      }

      const newBalance = currentBalance - amount;

      // Update wallet balance
      const { error: updateError } = await supabaseAdmin
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", wallet.id);

      if (updateError) throw updateError;

      // Log transaction
      const { error: logError } = await supabaseAdmin
        .from("ledger_transactions")
        .insert({
          from_wallet_id: wallet.id,
          transaction_type: "withdraw",
          amount: amount,
          description: "Wise transfer withdrawal",
          status: "completed",
        });

      if (logError) throw logError;

      return json({ success: true, message: `ทำการถอนเงินจำนวน ${amount.toLocaleString()} UNC สำเร็จ!` });
    }
  } catch (error: any) {
    console.error("Wallet transaction error:", error);
    return json({ 
      success: false, 
      error: error.message || "Failed to process wallet transaction" 
    }, { status: 500 });
  }
};

export default function Wallet() {
  const { wallet, ledgerHistory } = useLoaderData<LoaderData>();
  const actionData = useActionData<{ success: boolean; errors?: any; error?: string; message?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [modalType, setModalType] = useState<"deposit" | "withdraw" | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Close modal and reset form on action success
  useEffect(() => {
    if (actionData?.success) {
      setModalType(null);
      formRef.current?.reset();
    }
  }, [actionData]);

  const spendableBalance = Number(wallet.balance);
  const lockedBalance = Number(wallet.hold_balance);
  const totalBalance = spendableBalance + lockedBalance;

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "topup": return "Stripe Topup";
      case "withdraw": return "Wise Withdrawal";
      case "barter_payment": return "Barter Payment";
      case "barter_fee": return "Barter Fee";
      case "escrow_hold": return "Escrow Locked";
      case "escrow_release": return "Escrow Released";
      default: return type;
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">My Wallet & Ledger</h2>
        <p className="text-xs text-muted-foreground font-medium">
          ตรวจสอบยอดเงินคงเหลือ บัญชีค้ำประกัน Escrow และบัญชีแยกประเภทประวัติเดินคะแนนระบบ Unicorn Credits (UNC)
        </p>
      </div>

      {actionData?.message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs py-3.5 px-4 rounded-xl font-bold">
          ✓ {actionData.message}
        </div>
      )}

      {actionData?.error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground text-xs py-3.5 px-4 rounded-xl font-bold">
          ⚠️ {actionData.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Balance Breakdown & Actions */}
        <div className="md:col-span-5 space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -z-10" />
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Unicorn Credits Balance</span>
              <h3 className="text-4xl font-black text-emerald-400 tracking-wider">
                {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                <span className="text-xs font-bold text-white">UNC</span>
              </h3>
              <p className="text-xs text-muted-foreground font-medium">1.00 UNC = 1.00 USD (มูลค่าคงที่ค้ำประกันร่วม B2B)</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-muted-foreground block font-medium">Spendable Balance</span>
                <span className="font-extrabold text-white text-base">
                  {spendableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-muted-foreground block font-medium">Escrow Locked</span>
                <span className="font-extrabold text-amber-500 text-base">
                  {lockedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex gap-3 text-center">
              <button
                onClick={() => setModalType("deposit")}
                className="flex-1 bg-primary hover:bg-primary/90 text-black text-xs font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-primary/20"
              >
                Deposit (Stripe)
              </button>
              <button
                onClick={() => setModalType("withdraw")}
                className="flex-1 glass-card hover:bg-white/10 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition border border-white/10"
              >
                Withdraw (Wise)
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Log history */}
        <div className="md:col-span-7 space-y-6">
          <h3 className="font-extrabold text-lg text-white">📜 Ledger Journal History</h3>
          <div className="glass-card p-6 rounded-2xl space-y-4">
            {ledgerHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs font-medium">
                ไม่มีประวัติการทำรายการธุรกรรมในกระเป๋านี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 pb-2 text-muted-foreground font-bold">
                      <th className="py-2">Transaction Details</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerHistory.map((log) => {
                      const isIncoming = log.to_wallet_id === wallet.id;
                      const amountNum = Number(log.amount);
                      
                      return (
                        <tr key={log.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition">
                          <td className="py-3 pr-2">
                            <div className="font-bold text-white">{getTransactionTypeLabel(log.transaction_type)}</div>
                            <div className="text-[10px] text-muted-foreground font-medium pt-0.5">
                              {log.description} | {new Date(log.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`font-extrabold text-xs ${
                              isIncoming ? "text-emerald-400" : "text-amber-400"
                            }`}>
                              {isIncoming ? "+" : "-"}{amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UNC
                            </span>
                            <div className="text-[9px] text-muted-foreground font-medium">
                              {isIncoming ? "+" : "-"}${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              log.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TRANSACTION MODAL (Deposit & Withdraw) */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#020308]/85 backdrop-blur-sm"
            onClick={() => setModalType(null)}
          />

          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl relative space-y-6 z-10 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-base font-black text-white capitalize">
                {modalType === "deposit" ? "Stripe Credit Topup" : "Wise Credit Withdrawal"}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-muted-foreground hover:text-white text-base font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition"
              >
                ✕
              </button>
            </div>

            <Form method="post" ref={formRef} className="space-y-4">
              <input type="hidden" name="actionType" value={modalType} />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="amount">
                  Amount ({wallet.currency})
                </label>
                <div className="relative">
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="1000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition pr-12"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    UNC
                  </span>
                </div>
                {actionData?.errors?.amount && (
                  <p className="text-red-400 text-xs mt-1 font-semibold">{actionData.errors.amount[0]}</p>
                )}
                {modalType === "withdraw" && (
                  <p className="text-[10px] text-muted-foreground font-semibold pt-1">
                    Spendable Balance: {spendableBalance.toLocaleString()} UNC
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-black text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSubmitting
                    ? (modalType === "deposit" ? "Processing..." : "Withdrawing...")
                    : (modalType === "deposit" ? "Confirm Deposit" : "Confirm Withdrawal")
                  }
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
