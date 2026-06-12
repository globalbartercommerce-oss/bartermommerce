import { Outlet, Link } from "@remix-run/react";

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col justify-center items-center p-6 overflow-hidden selection:bg-primary selection:text-black">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] -z-10 animate-pulse" />

      {/* Header Home Link */}
      <header className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-md">
            U
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">UNICORN</span>
        </Link>
      </header>

      {/* Main Glass Panel Card */}
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl relative">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-secondary/20 rounded-full blur-2xl -z-10" />
        <Outlet />
      </div>

      {/* Footer Branding */}
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        © 2026 Unicorn Global Commerce LLC. All rights reserved.
      </footer>
    </div>
  );
}
