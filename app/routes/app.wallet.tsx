export default function Wallet() {
  const ledgerHistory = [
    { id: "tx-1", type: "Stripe Topup", ref: "ch_3MvWpI...", amount: "+5,000.00 UNC", fiat: "$5,000.00 USD", status: "completed", date: "2026-06-12 10:24" },
    { id: "tx-2", type: "Barter Fee", ref: "agreement_1029", amount: "-150.00 UNC", fiat: "$150.00 USD equivalents", status: "completed", date: "2026-06-11 15:40" },
    { id: "tx-3", type: "Escrow Hold", ref: "escrow_rice_99", amount: "-4,500.00 UNC", fiat: "$4,500.00 USD equivalents", status: "locked", date: "2026-06-10 09:12" },
    { id: "tx-4", type: "Barter Settlement", ref: "agreement_1001", amount: "+12,000.00 UNC", fiat: "$12,000.00 USD equivalents", status: "completed", date: "2026-06-08 14:22" }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">My Wallet & Ledger</h2>
        <p className="text-xs text-muted-foreground">
          ตรวจสอบสถิติกิจกรรมทางการเงินของคะแนนระบบ บัญชีแยกประเภท Unicorn Credits (UNC) และการเชื่อมโยงระบบ Stripe/Wise
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Balance Breakdown & Actions */}
        <div className="md:col-span-5 space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -z-10" />
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Unicorn Credits Balance</span>
              <h3 className="text-4xl font-black text-emerald-400 tracking-wider">12,500.00 <span className="text-xs font-bold text-white">UNC</span></h3>
              <p className="text-xs text-muted-foreground">1.00 UNC = 1.00 USD (มูลค่าพอร์ตกลางค้ำประกัน)</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <span className="text-muted-foreground block mb-1">Spendable Balance</span>
                <span className="font-extrabold text-white text-base">12,500.00</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <span className="text-muted-foreground block mb-1">Escrow Locked</span>
                <span className="font-extrabold text-amber-500 text-base">4,500.00</span>
              </div>
            </div>

            <div className="flex gap-3 text-center">
              <button className="flex-1 bg-primary hover:bg-primary/90 text-black text-xs font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-primary/20">
                Deposit (Stripe)
              </button>
              <button className="flex-1 glass-card hover:bg-white/10 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition border border-white/10">
                Withdraw (Wise)
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Log history */}
        <div className="md:col-span-7 space-y-6">
          <h3 className="font-extrabold text-lg text-white">📜 Ledger Journal History</h3>
          <div className="glass-card p-6 rounded-2xl space-y-4">
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
                  {ledgerHistory.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition">
                      <td className="py-3">
                        <div className="font-bold text-white">{log.type}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Ref: {log.ref} | {log.date}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`font-extrabold ${
                          log.amount.startsWith("+") ? "text-emerald-400" : "text-amber-400"
                        }`}>
                          {log.amount}
                        </span>
                        <div className="text-[9px] text-muted-foreground">{log.fiat}</div>
                      </td>
                      <td className="py-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          log.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
