export default function Barter() {
  const barterOffersData = [
    {
      id: "offer-1029",
      sender: "RiceExporter Corp, TH",
      receiver: "GreenEnergy Co., US",
      status: "pending",
      itemsInvolved: [
        { title: "ส่งออกข้าวหอมมะลิไทย 10 ตัน", value: "15,000 UNC", direction: "sender_to_receiver" },
        { title: "โซล่าเซลล์ขนาด 50kW (Lithium-ion)", value: "18,000 UNC", direction: "receiver_to_sender" }
      ],
      balanceAdjustment: "ต้องจ่ายเพิ่ม 3,000.00 UNC",
      date: "2026-06-12"
    },
    {
      id: "offer-1001",
      sender: "DevTech SG, SG",
      receiver: "EcoPack Co., TH",
      status: "completed",
      itemsInvolved: [
        { title: "ระบบ ERP คลังสินค้าแบบคลาวด์", value: "8,000 UNC", direction: "sender_to_receiver" },
        { title: "กล่องลูกฟูก 50,000 ชิ้น", value: "8,000 UNC", direction: "receiver_to_sender" }
      ],
      balanceAdjustment: "แลกเปลี่ยนสำเร็จ (ไม่มีส่วนต่างเครดิต)",
      date: "2026-06-08"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Barter Contracts & Swaps</h2>
        <p className="text-xs text-muted-foreground">
          จัดทำข้อตกลงแลกเปลี่ยนสินค้า บริหารจัดการคำขอ และเริ่มขั้นตอนการล็อกระบบ Escrow เพื่อค้ำประกันความเสถียร
        </p>
      </div>

      <div className="space-y-6">
        {barterOffersData.map((offer) => (
          <div key={offer.id} className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
                  Contract #{offer.id}
                </span>
                <span className="text-[10px] text-muted-foreground">Created on: {offer.date}</span>
              </div>
              <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase ${
                offer.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {offer.status}
              </span>
            </div>

            {/* Trade flow visualization */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Sender to Receiver */}
                <div className="space-y-2">
                  <h4 className="font-bold text-primary">📤 From {offer.sender} to {offer.receiver}</h4>
                  {offer.itemsInvolved.filter(i => i.direction === "sender_to_receiver").map((item, idx) => (
                    <div key={idx} className="bg-[#0b0f19] p-3 rounded-xl flex justify-between items-center border border-white/5">
                      <span className="text-white font-medium">{item.title}</span>
                      <span className="font-bold text-emerald-400 flex-shrink-0">{item.value}</span>
                    </div>
                  ))}
                </div>
                
                {/* Receiver to Sender */}
                <div className="space-y-2">
                  <h4 className="font-bold text-secondary">📥 From {offer.receiver} to {offer.sender}</h4>
                  {offer.itemsInvolved.filter(i => i.direction === "receiver_to_sender").map((item, idx) => (
                    <div key={idx} className="bg-[#0b0f19] p-3 rounded-xl flex justify-between items-center border border-white/5">
                      <span className="text-white font-medium">{item.title}</span>
                      <span className="font-bold text-emerald-400 flex-shrink-0">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                <span className="text-muted-foreground font-semibold">
                  💵 Ledger Balance Adjustment: <span className="text-white font-extrabold">{offer.balanceAdjustment}</span>
                </span>
                {offer.status === "pending" && (
                  <div className="flex gap-2">
                    <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 px-4 rounded-xl font-bold transition">
                      Decline
                    </button>
                    <button className="bg-primary hover:bg-primary/90 text-black py-2 px-4 rounded-xl font-bold transition shadow-lg shadow-primary/25">
                      Approve & Lock Escrow
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
