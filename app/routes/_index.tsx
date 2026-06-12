import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden selection:bg-primary selection:text-black">
      {/* Background Radial Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] -z-10" />

      {/* Header / Nav */}
      <header className="glass-panel sticky top-0 z-50 w-full border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
            U
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">UNICORN</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#about" className="hover:text-white transition">About</a>
          <a href="#stats" className="hover:text-white transition">Global Directory</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/auth/login" className="text-sm font-semibold text-white hover:text-primary transition">
            Sign In
          </Link>
          <Link to="/auth/register" className="bg-primary hover:bg-primary/90 text-black text-sm font-semibold py-2 px-5 rounded-xl transition shadow-lg shadow-primary/25">
            Register Business
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-semibold text-primary">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              AI-Powered Barter Commerce Ecosystem
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Connect Thai & Asian Businesses to the{" "}
              <span className="text-gradient-primary">Global Barter Economy</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              แลกเปลี่ยนสินค้าและบริการแบบไร้เงินตราข้ามโลกด้วยระบบค้ำประกันอัจฉริยะ (Escrow) 
              ขับเคลื่อนโดย AI และสร้างโอกาสในการทำตลาด B2B ร่วมกับหอการค้าและสมาคมการค้าสากล
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/auth/register" className="bg-gradient-to-r from-primary to-emerald-600 hover:opacity-95 text-white font-bold py-4 px-8 rounded-2xl transition shadow-xl shadow-primary/20 text-center">
                Get Started Free
              </Link>
              <Link to="/app/dashboard" className="glass-card hover:bg-white/10 text-white font-bold py-4 px-8 rounded-2xl transition border border-white/10 text-center">
                Explore Dashboard Demo
              </Link>
            </div>
          </div>

          {/* Interactive Feature Cards Panel */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                💱
              </div>
              <h3 className="font-bold text-white text-lg">Multi-lateral Barter</h3>
              <p className="text-xs text-muted-foreground">
                แลกเปลี่ยนสินค้าเป็นกลุ่มวงปิดโดยใช้ Unicorn Credits (UNC) เป็นสื่อกลาง หลีกเลี่ยงข้อจำกัดการจับคู่แบบสองฝ่าย
              </p>
            </div>
            <div className="glass-card p-6 rounded-3xl space-y-4 lg:translate-y-6">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary text-xl font-bold">
                🤖
              </div>
              <h3 className="font-bold text-white text-lg">AI Smart Matching</h3>
              <p className="text-xs text-muted-foreground">
                ระบบแนะนำจับคู่คู่ค้าและสินค้าด้วย AI จากเวกเตอร์ความคล้ายคลึงของประวัติการค้าและความต้องการ
              </p>
            </div>
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl font-bold">
                🔒
              </div>
              <h3 className="font-bold text-white text-lg">Escrow Protection</h3>
              <p className="text-xs text-muted-foreground">
                รับประกันความปลอดภัยของดีล ป้องกันการฉ้อโกงด้วยการล็อกเครดิตระบบค้ำประกันจนกว่าคู่ค้าจะยืนยันรับมอบงานจริง
              </p>
            </div>
            <div className="glass-card p-6 rounded-3xl space-y-4 lg:translate-y-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 text-xl font-bold">
                🌍
              </div>
              <h3 className="font-bold text-white text-lg">Trade Directory</h3>
              <p className="text-xs text-muted-foreground">
                สร้างโปรไฟล์ธุรกิจพร้อมเชื่อมต่อหอการค้า หอการค้าไทย และกลุ่มสมาคมการค้ากว่า 50 ประเทศทั่วโลก
              </p>
            </div>
          </div>
        </div>

        {/* Global Statistics */}
        <section id="stats" className="mt-32 border-t border-white/5 pt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-white text-gradient-primary">50,000+</div>
              <div className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground">Members Registered</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-white text-gradient-secondary">10,000+</div>
              <div className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground">Verified Merchants</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-white text-gradient-amber">50+</div>
              <div className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground">Countries Active</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-white text-gradient-primary">100M+</div>
              <div className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground">Credits Traded (UNC)</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
