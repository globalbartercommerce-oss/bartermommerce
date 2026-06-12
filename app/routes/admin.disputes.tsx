export default function AdminDisputes() {
  const disputesData = [
    {
      id: "disp-101",
      escrowId: "escrow_rice_99",
      raisedBy: "GreenEnergy Co., US",
      assignedAdmin: "Admin John",
      status: "investigating",
      reason: "สินค้าพัสดุโซล่าเซลล์จัดส่งถึงท่าเรือกรุงเทพฯ เรียบร้อยแล้ว แต่คู่ค้าไทยยังไม่ได้ส่งข้าวกระสอบหอมมะลิตามข้อกำหนดในสัญญาแลกเปลี่ยน",
      amountLocked: "4,500.00 UNC",
      date: "2026-06-12"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Trade Disputes Management</h2>
        <p className="text-xs text-muted-foreground">
          ตรวจสอบ จัดการ และตัดสินกรณีข้อพิพาทการแลกเปลี่ยนสินค้าที่มีความขัดแย้งเกี่ยวกับยอด Escrow
        </p>
      </div>

      <div className="space-y-6">
        {disputesData.map((disp) => (
          <div key={disp.id} className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
                  Dispute #{disp.id}
                </span>
                <span className="text-[10px] text-muted-foreground">Raised on: {disp.date}</span>
              </div>
              <span className="text-[10px] font-extrabold px-3 py-1 rounded-full uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                {disp.status}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3 text-xs leading-relaxed">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground block">Escrow Reference ID:</span>
                  <span className="font-bold text-white">{disp.escrowId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Locked Value:</span>
                  <span className="font-bold text-emerald-400">{disp.amountLocked}</span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block">Raised By Business:</span>
                <span className="font-bold text-white">{disp.raisedBy}</span>
              </div>

              <div className="border-t border-white/5 pt-3">
                <span className="text-muted-foreground block font-semibold mb-1">Reason for Dispute:</span>
                <p className="text-muted-foreground">{disp.reason}</p>
              </div>
            </div>

            <div className="flex justify-between items-center flex-wrap gap-4 pt-2 text-xs">
              <span className="text-muted-foreground">
                Assigned Admin: <span className="text-white font-bold">{disp.assignedAdmin}</span>
              </span>
              <div className="flex gap-2">
                <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 px-4 rounded-xl font-bold transition">
                  Refund to Sender
                </button>
                <button className="bg-secondary hover:bg-secondary/90 text-white py-2 px-4 rounded-xl font-bold transition shadow-lg shadow-secondary/25">
                  Release to Receiver
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
