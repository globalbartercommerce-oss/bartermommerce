import { Link } from "@remix-run/react";

export default function Register() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Register Business</h2>
        <p className="text-xs text-muted-foreground">
          สมัครสมาชิกเพื่อเข้าสู่ตลาดการแลกเปลี่ยนเครดิตระดับโลก
        </p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="companyName">
            Company Name
          </label>
          <input
            id="companyName"
            type="text"
            placeholder="Unicorn Co., Ltd."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">
            Business Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="ceo@company.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="regNumber">
              Tax ID / Reg. No.
            </label>
            <input
              id="regNumber"
              type="text"
              placeholder="01055XXXXXXXX"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="country">
              Country
            </label>
            <select
              id="country"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary transition"
              defaultValue="TH"
            >
              <option value="TH" className="bg-background">Thailand</option>
              <option value="US" className="bg-background">United States</option>
              <option value="SG" className="bg-background">Singapore</option>
              <option value="JP" className="bg-background">Japan</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="industry">
            Industry Category
          </label>
          <input
            id="industry"
            type="text"
            placeholder="Agriculture, Food & Beverage, Logistic, etc."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-primary/20 text-sm"
        >
          Submit Registration
        </button>
      </form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-white/5"></div>
        <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase font-bold tracking-wider">or</span>
        <div className="flex-grow border-t border-white/5"></div>
      </div>

      <div className="text-center text-xs">
        <span className="text-muted-foreground">Already registered? </span>
        <Link to="/auth/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
