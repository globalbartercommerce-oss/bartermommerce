import { json, type LoaderFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/utils/auth.server";
import { supabaseAdmin } from "~/utils/supabase.server";
import { generateHybridMatches, type HybridMatchResult } from "~/utils/ai-matching";

interface LedgerLog {
  id: string;
  transaction_type: string;
  amount: number | string;
  description: string | null;
  status: string;
  created_at: string;
}

interface LoaderData {
  companyName: string;
  verificationStatus: string;
  balance: number;
  holdBalance: number;
  recentTransactions: LedgerLog[];
  aiMatches: HybridMatchResult[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  // 1. Fetch user's business
  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("id, company_name, verification_status")
    .eq("owner_id", userId)
    .single();

  if (!business) {
    throw new Error("ไม่พบข้อมูลร้านค้า กรุณาทำ Onboarding ก่อน");
  }

  // 2. Fetch user's wallet
  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("id, balance, hold_balance")
    .eq("business_id", business.id)
    .single();

  const balance = wallet ? Number(wallet.balance) : 0.00;
  const holdBalance = wallet ? Number(wallet.hold_balance) : 0.00;

  // 3. Fetch recent ledger logs
  let transactions: any[] = [];
  if (wallet) {
    const { data: txs } = await supabaseAdmin
      .from("ledger_transactions")
      .select("*")
      .or(`from_wallet_id.eq.${wallet.id},to_wallet_id.eq.${wallet.id}`)
      .order("created_at", { ascending: false })
      .limit(5);
    if (txs) {
      transactions = txs;
    }
  }

  // 4. Fetch listings for AI matching
  const { data: myListingsRaw } = await supabaseAdmin
    .from("listings")
    .select("id, title, category, estimated_value, business_id")
    .eq("business_id", business.id)
    .eq("status", "active");

  const { data: otherListingsRaw } = await supabaseAdmin
    .from("listings")
    .select(`
      id,
      title,
      category,
      estimated_value,
      business_id,
      business:business_id(company_name, country_code)
    `)
    .neq("business_id", business.id)
    .eq("status", "active");

  // Transform listings to HybridListing types
  const myListings = (myListingsRaw || []).map(l => ({
    id: l.id,
    title: l.title,
    category: l.category,
    estimated_value: Number(l.estimated_value),
    business_id: l.business_id,
    company_name: business.company_name,
    country_code: "TH",
  }));

  const otherListings = (otherListingsRaw || []).map((l: any) => ({
    id: l.id,
    title: l.title,
    category: l.category,
    estimated_value: Number(l.estimated_value),
    business_id: l.business_id,
    company_name: l.business?.company_name || "Unknown Business",
    country_code: l.business?.country_code || "US",
  }));

  // Generate dynamic recommendations
  const aiMatches = generateHybridMatches(myListings, otherListings);

  return json<LoaderData>({
    companyName: business.company_name,
    verificationStatus: business.verification_status || "PENDING",
    balance,
    holdBalance,
    recentTransactions: (transactions as unknown as LedgerLog[]) || [],
    aiMatches,
  });
};

export default function Dashboard() {
  const { companyName, verificationStatus, balance, holdBalance, recentTransactions, aiMatches } = useLoaderData<LoaderData>();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            Welcome Back, <span className="text-gradient-primary">{companyName}</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            ตรวจสอบดีลแลกเปลี่ยนที่นำเสนอโดยปัญญาประดิษฐ์ และควบคุมบัญชี Unicorn Credits ของธุรกิจคุณ
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/app/marketplace" className="bg-primary hover:bg-primary/90 text-black text-xs font-bold py-3 px-5 rounded-xl transition shadow-lg shadow-primary/20">
            Create Listing
          </Link>
          <Link to="/app/barter" className="glass-card hover:bg-white/10 text-white text-xs font-bold py-3 px-5 rounded-xl transition border border-white/10">
            View Offers
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Unicorn Credits (UNC)</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-400">
            {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-muted-foreground">กระเป๋าใช้งานปกติ (Spendable Wallet)</p>
        </div>
        <div className="glass-card p-6 rounded-2xl space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Escrow Holdings (UNC)</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-500">
            {holdBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-muted-foreground">คะแนนค้ำประกัน (Locked in Escrow)</p>
        </div>
        <div className="glass-card p-6 rounded-2xl space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Verified KYB Status</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary uppercase">{verificationStatus} MEMBER</h3>
          <p className="text-xs text-muted-foreground">ระดับความเชื่อมั่นการค้าระหว่างประเทศ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* AI Recommendations Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-lg text-white">🤖 AI Smart Matchmaker</h3>
            <span className="text-xs text-secondary font-bold bg-secondary/10 py-1 px-3 rounded-full">Active</span>
          </div>

          <div className="space-y-4">
            {aiMatches.map((match) => (
              <div key={match.id} className="glass-card p-6 rounded-2xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -z-10" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-full">
                    Match Rate: {match.similarity}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">AI Recommended</span>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-white block">Your Listing:</span>
                    {match.yourListing}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-white block">Matched With:</span>
                    {match.matchedWith}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground border-t border-white/5 pt-3 leading-relaxed">
                  💡 <span className="font-semibold text-white">AI Analysis:</span> {match.rationale}
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <Link
                    to="/app/barter"
                    className="bg-primary hover:bg-primary/95 text-black text-xs font-bold py-2 px-4 rounded-xl transition shadow shadow-primary/20"
                  >
                    Propose Swap Contract
                  </Link>
                </div>
              </div>
            ))}

            {aiMatches.length === 0 && (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl text-muted-foreground text-xs font-semibold">
                ไม่มีข้อมูลจับคู่ในขณะนี้ เพิ่มสินค้าเพื่อเริ่มเปรียบเทียบการแลกเปลี่ยน
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity/Ledger Panel */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="font-extrabold text-lg text-white">📋 Recent Activity Log</h3>
          <div className="glass-card p-6 rounded-2xl space-y-4">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-b-0">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white capitalize">{tx.transaction_type.replace("_", " ")}</h4>
                  <p className="text-[10px] text-muted-foreground max-w-[180px] truncate">{tx.description}</p>
                  <span className="text-[8px] text-muted-foreground block">{new Date(tx.created_at).toLocaleDateString()}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-extrabold text-white`}>
                    {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} UNC
                  </span>
                  <span className="block text-[8px] text-muted-foreground uppercase">{tx.status}</span>
                </div>
              </div>
            ))}

            {recentTransactions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-xs font-medium">
                ไม่มีบันทึกธุรกรรมในประวัติของคุณ
              </div>
            )}

            <Link to="/app/wallet" className="block text-center text-xs font-bold text-primary hover:underline pt-2">
              View Detailed Ledger Wallet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

