import { json, redirect, type LoaderFunction } from "@remix-run/node";
import { Outlet, Link, useLocation, useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/utils/auth.server";
import { supabaseAdmin } from "~/utils/supabase.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const url = new URL(request.url);

  // If already on the onboarding page, do not guard redirect to prevent infinite loops
  if (url.pathname === "/app/onboarding") {
    return json({ user: { id: userId }, business: null, wallet: null });
  }

  // Fetch business profile to check onboarding completion
  const { data: business, error } = await supabaseAdmin
    .from("businesses")
    .select("id, company_name, phone, verification_status")
    .eq("owner_id", userId)
    .single();

  // If business record doesn't exist, or doesn't have phone (meaning onboarding incomplete), redirect to onboarding
  if (error || !business || !business.phone) {
    return redirect("/app/onboarding");
  }

  // Fetch or create wallet
  let { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance, hold_balance")
    .eq("business_id", business.id)
    .single();

  if (!wallet) {
    const { data: newWallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .insert({ business_id: business.id, balance: 0.00, hold_balance: 0.00, currency: "UNC" })
      .select("balance, hold_balance")
      .single();
    if (!walletError && newWallet) {
      wallet = newWallet;
    }
  }

  return json({ 
    user: { id: userId }, 
    business, 
    wallet: wallet || { balance: 0.00, hold_balance: 0.00 } 
  });
};

export default function AppLayout() {
  const location = useLocation();
  const { business, wallet } = useLoaderData<{
    business: { company_name: string; verification_status: string } | null;
    wallet: { balance: number; hold_balance: number } | null;
  }>();
  
  const navItems = [
    { label: "Dashboard", path: "/app/dashboard", icon: "📊" },
    { label: "Marketplace", path: "/app/marketplace", icon: "🛒" },
    { label: "Merchant Directory", path: "/app/directory", icon: "🏢" },
    { label: "My Wallet", path: "/app/wallet", icon: "💳" },
    { label: "Barter Contracts", path: "/app/barter", icon: "💱" },
  ];

  return (
    <div className="min-h-screen bg-[#070a13] text-white flex flex-col md:flex-row selection:bg-primary selection:text-black">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-white/5 p-6 space-y-8 flex-shrink-0">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-md">
            U
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">UNICORN</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 py-3 px-4 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade / Account box */}
        <div className="glass-card p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full uppercase border border-primary/20">
              {business?.verification_status || "PENDING"} Member
            </span>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs text-muted-foreground font-semibold">Verified KYB</h4>
            <p className="text-xs text-white truncate font-bold">{business?.company_name || "Unicorn Global Link"}</p>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header - Desktop & Mobile */}
        <header className="glass-panel border-b border-white/5 py-4 px-6 md:px-10 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            {/* Logo Mobile Only */}
            <Link to="/" className="md:hidden flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white text-sm">
                U
              </div>
            </Link>
            <h2 className="hidden sm:block text-sm text-muted-foreground font-semibold tracking-wide uppercase">
              Global Barter Ecosystem
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Wallet Quick Balance */}
            {wallet && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 py-1.5 px-3.5 rounded-2xl">
                <span className="text-xs font-semibold text-emerald-400">Balance:</span>
                <span className="font-extrabold text-sm text-emerald-300 tracking-wider">
                  {Number(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UNC
                </span>
              </div>
            )}

            {/* User Profile avatar */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary/20 border border-secondary/35 flex items-center justify-center font-bold text-white text-xs">
                {(business?.company_name || "U").substring(0, 3).toUpperCase()}
              </div>
              <span className="hidden lg:block text-xs font-bold text-white">{business?.company_name || "Unicorn Thailand"}</span>
            </div>
          </div>
        </header>

        {/* Sub-route contents */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation bar at the bottom */}
      <nav className="md:hidden glass-panel border-t border-white/5 fixed bottom-0 left-0 right-0 py-2.5 px-6 flex justify-around items-center z-40">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
