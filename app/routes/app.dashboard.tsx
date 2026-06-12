import { Link } from "@remix-run/react";

export default function Dashboard() {
  const aiMatches = [
    {
      id: "match-1",
      yourListing: "ส่งออกข้าวหอมมะลิเกรดพรีเมียม 10 ตัน",
      matchedWith: "Solar Cells & Battery Storage (Green Energy Co., US)",
      similarity: "98.5%",
      rationale: "ผู้ซื้อชาวอเมริกันกำลังมองหาพันธมิตรข้าวหอมมะลิไทย และยินดีชำระด้วยระบบโซล่าเซลล์สำหรับโรงสี",
    },
    {
      id: "match-2",
      yourListing: "บริการพัฒนาซอฟต์แวร์ ERP ระบบคลังสินค้า",
      matchedWith: "พัสดุกล่องลูกฟูกรักษ์โลก 50,000 ชิ้น (EcoPack Co., SG)",
      similarity: "92.1%",
      rationale: "ต้องการแลกเปลี่ยนกล่องบรรจุภัณฑ์รักษ์โลกเพื่อใช้ส่งสินค้า แทนการชำระเงินสดให้บริษัทในสิงคโปร์",
    }
  ];

  const recentTransactions = [
    { id: "tx-1", type: "topup", details: "Top-up via Stripe (Inbound)", amount: "+5,000.00", status: "completed", date: "2026-06-12" },
    { id: "tx-2", type: "barter_fee", details: "Barter Transaction Fee (Deal #1029)", amount: "-150.00", status: "completed", date: "2026-06-11" },
    { id: "tx-3", type: "escrow_hold", details: "Escrow Hold - Thai Jasmine Rice Trade", amount: "-4,500.00", status: "completed", date: "2026-06-10" }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome Back, <span className="text-gradient-primary">Unicorn Thailand</span>
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
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-400">12,500.00</h3>
          <p className="text-xs text-muted-foreground">กระเป๋าใช้งานปกติ (Spendable Wallet)</p>
        </div>
        <div className="glass-card p-6 rounded-2xl space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Escrow Holdings (UNC)</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-500">4,500.00</h3>
          <p className="text-xs text-muted-foreground">คะแนนค้ำประกัน (Locked in Escrow)</p>
        </div>
        <div className="glass-card p-6 rounded-2xl space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Verified KYB Status</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">Active Gold</h3>
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
                  <span className="text-[10px] text-muted-foreground">{match.id}</span>
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
                  <button className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold py-2 px-4 rounded-xl transition border border-primary/10">
                    Propose Swap Contract
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity/Ledger Panel */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="font-extrabold text-lg text-white">📋 Recent Activity Log</h3>
          <div className="glass-card p-6 rounded-2xl space-y-4">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-b-0">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">{tx.details}</h4>
                  <span className="text-[10px] text-muted-foreground">{tx.date}</span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-extrabold ${
                    tx.amount.startsWith("+") ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {tx.amount}
                  </span>
                  <span className="block text-[8px] text-muted-foreground uppercase">{tx.status}</span>
                </div>
              </div>
            ))}
            <Link to="/app/wallet" className="block text-center text-xs font-bold text-primary hover:underline pt-2">
              View Detailed Ledger Wallet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
