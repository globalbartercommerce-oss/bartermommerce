export default function Marketplace() {
  const listingsData = [
    {
      id: "list-1",
      title: "ข้าวหอมมะลิไทยเกรดพรีเมียม 10 ตัน (บรรจุกระสอบสุญญากาศ)",
      category: "เกษตรกรรมและอาหาร",
      estimatedValue: "$15,000",
      credits: "15,000 UNC",
      owner: "RiceExporter Corp, TH",
      status: "active",
      image: "🌾"
    },
    {
      id: "list-2",
      title: "แบตเตอรี่จัดเก็บพลังงานโซล่าเซลล์ขนาด 50kW (Lithium-ion)",
      category: "พลังงานและไฟฟ้า",
      estimatedValue: "$18,000",
      credits: "18,000 UNC",
      owner: "GreenEnergy Co., US",
      status: "active",
      image: "🔋"
    },
    {
      id: "list-3",
      title: "บริการพัฒนาโมเดล AI และวิเคราะห์ข้อมูลเวกเตอร์องค์กร",
      category: "เทคโนโลยีสารสนเทศ",
      estimatedValue: "$20,000",
      credits: "20,000 UNC",
      owner: "DevTech SG, SG",
      status: "active",
      image: "💻"
    },
    {
      id: "list-4",
      title: "กล่องลูกฟูกบรรจุภัณฑ์รักษ์โลก 50,000 ชิ้น",
      category: "อุตสาหกรรมกระดาษและกล่อง",
      estimatedValue: "$8,000",
      credits: "8,000 UNC",
      owner: "EcoPack Co., TH",
      status: "active",
      image: "📦"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Global Marketplace</h2>
          <p className="text-xs text-muted-foreground">
            ค้นหาและร่วมเสนอสัญญาแลกเปลี่ยนสินค้าและบริการ B2B ในระบบเครือข่ายธุรกิจ
          </p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-black text-xs font-bold py-3 px-5 rounded-xl transition shadow-lg shadow-primary/20">
          + Add New Listing
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="ค้นหาสินค้า บริการ หรือคู่ค้า..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
        />
        <select className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary transition">
          <option value="" className="bg-background">ทุกหมวดหมู่</option>
          <option value="agri" className="bg-background">เกษตรกรรมและอาหาร</option>
          <option value="energy" className="bg-background">พลังงาน</option>
          <option value="tech" className="bg-background">เทคโนโลยี</option>
        </select>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {listingsData.map((item) => (
          <div key={item.id} className="glass-card p-6 rounded-2xl flex gap-6 items-start">
            <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl flex-shrink-0">
              {item.image}
            </div>
            <div className="space-y-4 flex-1 min-w-0">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {item.category}
                </span>
                <h3 className="font-extrabold text-white text-base truncate">{item.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Owner:</span>
                  <span className="font-semibold text-white">{item.owner}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-t border-white/5 pt-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Credits Required</span>
                  <span className="font-black text-emerald-400 text-sm">{item.credits}</span>
                  <span className="text-[10px] text-muted-foreground block">(Estimated value: {item.estimatedValue})</span>
                </div>
                <button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold py-2.5 px-4 rounded-xl transition">
                  Propose Swap
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
