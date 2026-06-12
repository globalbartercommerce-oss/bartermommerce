import { Link } from "@remix-run/react";

export default function Login() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Sign In to Platform</h2>
        <p className="text-xs text-muted-foreground">
          เข้าสู่ระบบเพื่อจัดการกระเป๋า Unicorn Credits และข้อเสนอดีล
        </p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
            Business Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@company.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">
              Password
            </label>
            <a href="#forgot" className="text-xs font-semibold text-primary hover:underline">
              Forgot?
            </a>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-primary/20 text-sm"
        >
          Sign In
        </button>
      </form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-white/5"></div>
        <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase font-bold tracking-wider">or</span>
        <div className="flex-grow border-t border-white/5"></div>
      </div>

      <div className="text-center text-xs">
        <span className="text-muted-foreground">Don't have a business registered yet? </span>
        <Link to="/auth/register" className="font-semibold text-primary hover:underline">
          Register Business
        </Link>
      </div>
    </div>
  );
}
