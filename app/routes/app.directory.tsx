export default function Directory() {
  const merchants = [
    { id: "m-1", name: "Unicorn Global Link", country: "Thailand 🇹🇭", industry: "B2B Technology & Consulting", chapters: ["Thai Chamber of Commerce", "Global Trade Link"], status: "Active Gold" },
    { id: "m-2", name: "Green Energy Corp", country: "United States 🇺🇸", industry: "Renewable Energy & Solar Hardware", chapters: ["US Solar Trade Council"], status: "Active Platinum" },
    { id: "m-3", name: "Asia Foods Exporter Co.", country: "Thailand 🇹🇭", industry: "Agriculture & Food Processing", chapters: ["Thai Rice Exporters Association"], status: "Active Gold" },
    { id: "m-4", name: "DevTech SG Ltd.", country: "Singapore 🇸🇬", industry: "Software Development & IT Outsourcing", chapters: ["Singapore Tech Guild"], status: "Active Silver" }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Merchant Directory</h2>
        <p className="text-xs text-muted-foreground">
          รายนามผู้ประกอบการที่ผ่านการรับรอง KYB และสมาคมธุรกิจระดับโลกเพื่อสร้างสายสัมพันธ์ทางการค้า B2B
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {merchants.map((merchant) => (
          <div key={merchant.id} className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-extrabold text-white text-base">{merchant.name}</h3>
                <span className="text-xs text-muted-foreground block">{merchant.industry}</span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                merchant.status.includes("Platinum")
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}>
                {merchant.status}
              </span>
            </div>

            <div className="space-y-2 border-t border-white/5 pt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country / Region:</span>
                <span className="font-semibold text-white">{merchant.country}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Trade Affiliations / Chapters:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {merchant.chapters.map((chap, idx) => (
                    <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-[10px] text-muted-foreground">
                      {chap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="pt-2 flex justify-end">
              <button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold py-2 px-4 rounded-xl transition">
                Contact & Trade
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
