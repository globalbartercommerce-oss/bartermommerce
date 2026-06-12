import { Outlet, Link } from "@remix-run/react";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#09050d] text-white flex flex-col md:flex-row selection:bg-secondary selection:text-black">
      {/* Admin Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-white/5 p-6 space-y-8 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-secondary to-pink-500 flex items-center justify-center font-bold text-white shadow-md">
            A
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">UNICORN ADMIN</span>
        </Link>

        <nav className="flex-1 space-y-1.5">
          <Link
            to="/app/dashboard"
            className="flex items-center gap-3.5 py-3 px-4 rounded-xl text-sm font-semibold text-muted-foreground hover:text-white hover:bg-white/5 transition"
          >
            <span>⬅️</span> Back to App
          </Link>
          <div className="border-t border-white/5 my-2"></div>
          <Link
            to="/admin/disputes"
            className="flex items-center gap-3.5 py-3 px-4 rounded-xl text-sm font-semibold bg-secondary/10 text-secondary border border-secondary/20 transition"
          >
            <span>⚖️</span> Trade Disputes
          </Link>
        </nav>

        <div className="text-xs text-muted-foreground">
          Platform Operator Mode
        </div>
      </aside>

      {/* Main Admin Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="glass-panel border-b border-white/5 py-4 px-6 md:px-10 flex justify-between items-center z-10">
          <h2 className="text-sm text-secondary font-bold tracking-wide uppercase">
            🛡️ Platform Administration Panel
          </h2>
          <div className="text-xs font-semibold text-muted-foreground bg-white/5 py-1 px-3 rounded-full border border-white/10">
            System Admin Role
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
