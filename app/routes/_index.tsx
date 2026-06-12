import { useState } from "react";
import { Link } from "@remix-run/react";

const CONTENT = {
  th: {
    nav: {
      features: "คุณสมบัติระบบ",
      about: "ข้อมูลบริษัท",
      values: "ค่านิยมองค์กร",
      industries: "กลุ่มธุรกิจ",
      contact: "ติดต่อเรา",
    },
    hero: {
      tag: "Unicorn Global Commerce LLC — เครือข่ายธุรกิจระดับสากล",
      title: "เชื่อมโยงธุรกิจไทยและอาเซียนสู่",
      titleColor: "ระบบการค้าแลกเปลี่ยนสากล",
      desc: "แพลตฟอร์มธุรกิจยุคใหม่ที่ช่วยให้ผู้ประกอบการ สมาคมการค้า และนักลงทุน สามารถแลกเปลี่ยนสินค้าและบริการข้ามพรมแดนอย่างไร้ข้อจำกัด ขับเคลื่อนด้วยระบบค้ำประกันอัจฉริยะ (Escrow) และ AI Matching",
      ctaRegister: "ลงทะเบียนธุรกิจฟรี",
      ctaDemo: "ชมเดโมแดชบอร์ด",
    },
    about: {
      title: "เครือข่ายธุรกิจระดับสากล",
      subtitle: "GLOBAL BUSINESS NETWORK",
      desc1: "เครือข่ายธุรกิจของ Unicorn Global Commerce LLC ครอบคลุมการเชื่อมโยงพันธมิตรทางธุรกิจระหว่างประเทศ โดยมุ่งเน้นการสร้างโอกาสทางธุรกิจระหว่างสหรัฐอเมริกา ประเทศไทย และภูมิภาคอาเซียน",
      desc2: "เรามีฐานการดำเนินงานที่แข็งแกร่งในประเทศไทยผ่านทาง **Unicorn Global Link** ([unicorngloballink.com](https://unicorngloballink.com)) ซึ่งทำหน้าที่เชื่อมโยงผู้ประกอบการไทยเข้าสู่ระบบนิเวศธุรกิจระดับสากลของเราอย่างเป็นรูปธรรม",
      points: [
        "การเชื่อมโยงเครือข่ายธุรกิจระดับนานาชาติ",
        "การสร้างพันธมิตรธุรกิจเชิงกลยุทธ์ (Strategic Partnership)",
        "การขยายตลาดระหว่างประเทศ",
        "การสร้างโอกาสทางการค้าใหม่ ๆ",
        "การสนับสนุนธุรกิจ SME และธุรกิจยุคใหม่",
      ],
      philosophy: "ภายใต้ปรัชญา \"Global Connection • Strategic Growth\" เราเชื่อว่าความร่วมมือทางธุรกิจ คือกุญแจสำคัญของการเติบโตในเศรษฐกิจโลกยุคใหม่",
    },
    platform: {
      title: "แพลตฟอร์มธุรกิจยุคใหม่",
      subtitle: "STRATEGIC BUSINESS PLATFORM",
      desc: "Unicorn Global Commerce LLC พัฒนาระบบธุรกิจที่มุ่งเน้นการเชื่อมโยงโอกาสทางธุรกิจผ่านแนวคิด Modern Business Platform และ Cross-Border Commerce",
      pointsTitle: "บริษัทให้ความสำคัญกับการสร้าง:",
      points: [
        "ระบบเชื่อมโยงธุรกิจระหว่างประเทศ",
        "ระบบจับคู่ธุรกิจอัจฉริยะ (Business Matching)",
        "พันธมิตรธุรกิจเชิงกลยุทธ์ (Strategic Business Alliance)",
        "โอกาสทางการค้าระดับโลก (International Trade Opportunities)",
        "ระบบนิเวศการแลกเปลี่ยนการค้ายุคใหม่ (Modern Business Ecosystem)",
      ],
      visionTitle: "โอกาสใหม่ในเศรษฐกิจดิจิทัล",
      visionDesc: "เรามองเห็นโอกาสใหม่ของเศรษฐกิจยุคดิจิทัล ที่ธุรกิจสามารถเติบโตได้ผ่านการเชื่อมโยงเครือข่าย ความร่วมมือ และการขยายตลาดระดับโลก แพลตฟอร์มของเราช่วยให้ธุรกิจสามารถสร้างพันธมิตรใหม่ เพิ่มโอกาสการค้า และยกระดับภาพลักษณ์สู่ระดับสากล",
    },
    values: {
      title: "ค่านิยมองค์กร",
      subtitle: "OUR CORE VALUES",
      list: [
        { title: "Integrity", desc: "ความซื่อสัตย์และความโปร่งใสในทุกข้อตกลงและการแลกเปลี่ยนการค้า" },
        { title: "Innovation", desc: "การนำเทคโนโลยี AI และระบบค้ำประกันอัจฉริยะมาขับเคลื่อนเศรษฐกิจ" },
        { title: "Global Vision", desc: "วิสัยทัศน์ระดับสากล เชื่อมโยงตลาดสหรัฐอเมริกา ไทย และอาเซียน" },
        { title: "Strategic Partnership", desc: "การร่วมมือพันธมิตรเชิงกลยุทธ์เพื่อความแข็งแกร่งในระยะยาว" },
        { title: "Sustainable Growth", desc: "การเติบโตอย่างยั่งยืนของธุรกิจสมาชิกและระบบนิเวศเศรษฐกิจร่วมกัน" },
      ]
    },
    industries: {
      title: "กลุ่มธุรกิจที่เราเชื่อมโยง",
      subtitle: "INDUSTRIES WE CONNECT",
      list: [
        { name: "สุขภาพและเวลเนส", icon: "🏥", en: "Health & Wellness" },
        { name: "ธุรกิจบริการ", icon: "🤝", en: "Service Industries" },
        { name: "โรงแรมและท่องเที่ยว", icon: "🏨", en: "Hospitality & Tourism" },
        { name: "อสังหาริมทรัพย์", icon: "🏢", en: "Real Estate" },
        { name: "ธุรกิจอาหารและเครื่องดื่ม", icon: "🍔", en: "Food & Beverage" },
        { name: "ธุรกิจความงามและไลฟ์สไตล์", icon: "💄", en: "Beauty & Lifestyle" },
        { name: "ธุรกิจการศึกษา", icon: "🎓", en: "Education" },
        { name: "ธุรกิจดิจิทัลและออนไลน์", icon: "💻", en: "Digital & Online Business" },
      ]
    },
    statement: {
      text: "เราเชื่อว่า “เครือข่าย” คือสินทรัพย์ที่ทรงพลังที่สุดของโลกธุรกิจยุคใหม่",
      sub: "Unicorn Global Commerce LLC จึงมุ่งมั่นในการสร้างระบบธุรกิจที่ช่วยเชื่อมโยงโอกาส ความร่วมมือ และการเติบโตทางธุรกิจในระดับสากล",
    },
    partnership: {
      title: "ร่วมเป็นพันธมิตรกับเรา",
      subtitle: "PARTNERSHIP SECTION",
      desc: "เรายินดีต้อนรับพันธมิตรทุกท่านในการสร้างโอกาสทางธุรกิจร่วมกันในระดับสากล",
      list: [
        "นักลงทุน (Investors)",
        "พันธมิตรเชิงกลยุทธ์ (Strategic Partners)",
        "เจ้าของธุรกิจ (Business Owners)",
        "ผู้ประกอบการ (Entrepreneurs)",
        "บริษัทต่างประเทศ (International Companies)",
        "เครือข่ายธุรกิจ (Business Networks)",
      ],
      cta: "กรอกข้อมูลความสนใจด้านล่างเพื่อร่วมเป็นพันธมิตร",
    },
    contact: {
      title: "ติดต่อเรา / ร่วมเป็นพันธมิตร",
      desc: "ส่งข้อมูลความต้องการของคุณเพื่อเริ่มต้นการเชื่อมต่อระดับโลกกับเรา",
      name: "ชื่อผู้ติดต่อ",
      company: "ชื่อบริษัท / องค์กร",
      email: "อีเมลติดต่อ",
      phone: "เบอร์โทรศัพท์",
      message: "ข้อความ / รายละเอียดความสนใจร่วมมือ",
      submit: "ส่งข้อมูลการติดต่อ",
      sending: "กำลังส่ง...",
      success: "ส่งข้อมูลเรียบร้อยแล้ว! เจ้าหน้าที่ของเราจะติดต่อกลับโดยเร็วที่สุด",
    },
    ceo: {
      title: "สาส์นจากผู้บริหาร",
      subtitle: "CEO MESSAGE",
      quote: "สะพานเชื่อมโอกาสทางธุรกิจจากไทยสู่อเมริกาและระดับสากล",
      text: "เราจัดตั้ง Unicorn Global Commerce LLC ขึ้นที่ประเทศสหรัฐอเมริกาเพื่อทำหน้าที่เป็นเสมือนสะพานเศรษฐกิจดิจิทัลที่เชื่อมโยงผู้ประกอบการและสมาคมการค้าไทย-อาเซียนเข้าสู่ตลาดอเมริกา ด้วยระบบ Barter Platform และเทคโนโลยีค้ำประกันยุคใหม่ เราพร้อมสนับสนุนให้แบรนด์ของท่านก้าวสู่ระดับสากลอย่างมั่นคง",
      author: "Unicorn Executive Board",
      role: "Unicorn Global Commerce LLC",
    }
  },
  en: {
    nav: {
      features: "Features",
      about: "Corporate Info",
      values: "Core Values",
      industries: "Industries",
      contact: "Contact Us",
    },
    hero: {
      tag: "Unicorn Global Commerce LLC — International B2B Network",
      title: "Connecting Thai & ASEAN Businesses to the",
      titleColor: "Global Barter Economy",
      desc: "A modern business platform enabling entrepreneurs, trade associations, and investors to exchange products and services globally without borders. Powered by AI Smart Matching and Escrow protection.",
      ctaRegister: "Register Business",
      ctaDemo: "Explore Demo Dashboard",
    },
    about: {
      title: "International Business Network",
      subtitle: "GLOBAL BUSINESS NETWORK",
      desc1: "Unicorn Global Commerce LLC focuses on building international business connections and strategic partnerships across the United States, Thailand, and ASEAN markets.",
      desc2: "With a strong operational base in Thailand through **Unicorn Global Link** ([unicorngloballink.com](https://unicorngloballink.com)), we bridge Thai entrepreneurs into our global business ecosystem with concrete local support.",
      points: [
        "Building international business networks",
        "Developing strategic partnerships",
        "Supporting global market expansion",
        "Creating new trade opportunities",
        "Empowering SMEs and modern businesses",
      ],
      philosophy: "Through our philosophy \"Global Connection • Strategic Growth\", we believe that business collaboration is the key to sustainable growth in the modern global economy.",
    },
    platform: {
      title: "Strategic Business Platform",
      subtitle: "STRATEGIC BUSINESS PLATFORM",
      desc: "Unicorn Global Commerce LLC develops modern business solutions focused on international business connectivity, strategic partnerships, and cross-border commerce opportunities.",
      pointsTitle: "Our platform is designed to support:",
      points: [
        "International Business Networking System",
        "Business Matching Services",
        "Strategic Business Alliances",
        "Global Trade Opportunities",
        "Modern Business Exchange Ecosystems",
      ],
      visionTitle: "New Opportunities in Digital Economy",
      visionDesc: "We believe the future of business growth is driven by global connectivity, collaboration, and strategic expansion. Our mission is to help businesses build valuable partnerships, expand internationally, create new opportunities, and strengthen their global corporate presence.",
    },
    values: {
      title: "Our Core Values",
      subtitle: "OUR CORE VALUES",
      list: [
        { title: "Integrity", desc: "Honesty and absolute transparency in every trade transaction and escrow deal." },
        { title: "Innovation", desc: "Leveraging AI smart matching and digital barter system to drive efficiency." },
        { title: "Global Vision", desc: "Linking US, Thailand, and ASEAN markets into a unified commerce network." },
        { title: "Strategic Partnership", desc: "Fostering long-term strategic alliances for sustained synergy." },
        { title: "Sustainable Growth", desc: "Enabling shared prosperity and economic sustainability for all members." },
      ]
    },
    industries: {
      title: "Industries We Connect",
      subtitle: "INDUSTRIES WE CONNECT",
      list: [
        { name: "Health & Wellness", icon: "🏥", en: "Health & Wellness" },
        { name: "Service Industries", icon: "🤝", en: "Service Industries" },
        { name: "Hospitality & Tourism", icon: "🏨", en: "Hospitality & Tourism" },
        { name: "Real Estate", icon: "🏢", en: "Real Estate" },
        { name: "Food & Beverage", icon: "🍔", en: "Food & Beverage" },
        { name: "Beauty & Lifestyle", icon: "💄", en: "Beauty & Lifestyle" },
        { name: "Education", icon: "🎓", en: "Education" },
        { name: "Digital & Online Business", icon: "💻", en: "Digital & Online Business" },
      ]
    },
    statement: {
      text: "We believe that “networking” is one of the most valuable assets in the modern business world.",
      sub: "Unicorn Global Commerce LLC is committed to creating global business opportunities through collaboration, strategic partnerships, and international connectivity.",
    },
    partnership: {
      title: "Join Our Global Network",
      subtitle: "PARTNERSHIP SECTION",
      desc: "We welcome partners from all over the world who are interested in creating global business opportunities together.",
      list: [
        "Investors",
        "Strategic Partners",
        "Business Owners",
        "Entrepreneurs",
        "International Companies",
        "Business Networks",
      ],
      cta: "Submit your information below to partner with us",
    },
    contact: {
      title: "Contact Us & Strategic Partnership",
      desc: "Submit your request to start your global connection with Unicorn Global Commerce.",
      name: "Contact Person Name",
      company: "Company Name / Organization",
      email: "Contact Email",
      phone: "Phone Number",
      message: "Message / Collaboration Details",
      submit: "Submit Contact Form",
      sending: "Sending...",
      success: "Your message has been sent successfully! Our representative will contact you shortly.",
    },
    ceo: {
      title: "Corporate Message",
      subtitle: "CEO MESSAGE",
      quote: "Bridging Opportunities from Thailand to the USA & Beyond",
      text: "Unicorn Global Commerce LLC was established in the United States to act as a digital economic bridge connecting Thai and ASEAN enterprises to the US market. Utilizing our premium barter system and escrow technologies, we are dedicated to helping your brand expand globally with confidence.",
      author: "Unicorn Executive Board",
      role: "Unicorn Global Commerce LLC",
    }
  }
};

export default function Index() {
  const [lang, setLang] = useState<"th" | "en">("th");
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const t = CONTENT[lang];

  const handleLangToggle = () => {
    setLang((prev) => (prev === "th" ? "en" : "th"));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate contact submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: "", company: "", email: "", phone: "", message: "" });
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden selection:bg-primary selection:text-black">
      {/* Background Radial Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] -z-10" />
      <div className="absolute top-1/2 left-2/3 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -z-10" />

      {/* Header / Nav */}
      <header className="glass-panel sticky top-0 z-50 w-full border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
            U
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white flex flex-col leading-none">
            <span>UNICORN</span>
            <span className="text-[9px] font-semibold text-primary tracking-widest mt-0.5">GLOBAL COMMERCE</span>
          </span>
        </div>
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#about" className="hover:text-white transition">{t.nav.about}</a>
          <a href="#values" className="hover:text-white transition">{t.nav.values}</a>
          <a href="#industries" className="hover:text-white transition">{t.nav.industries}</a>
          <a href="#contact" className="hover:text-white transition">{t.nav.contact}</a>
        </nav>
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <button
            onClick={handleLangToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-primary/50 bg-white/5 text-xs font-bold text-white transition-all duration-200"
            aria-label="Toggle Language"
          >
            🌐 <span className="text-primary">{lang === "th" ? "EN" : "TH"}</span>
          </button>

          <Link to="/auth/login" className="text-sm font-semibold text-white hover:text-primary transition">
            Sign In
          </Link>
          <Link to="/auth/register" className="bg-primary hover:bg-primary/95 text-black text-sm font-extrabold py-2 px-5 rounded-xl transition shadow-lg shadow-primary/25">
            Register Business
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-primary shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 to-blue-500 shadow-md" />
              🇺🇸 ↔ 🇹🇭 USA & Thailand B2B Alliance
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-white">
              {t.hero.title}{" "}
              <span className="text-gradient-primary">{t.hero.titleColor}</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {t.hero.desc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/auth/register" className="bg-gradient-to-r from-primary to-emerald-600 hover:opacity-95 text-white font-bold py-4 px-8 rounded-2xl transition shadow-xl shadow-primary/20 text-center">
                {t.hero.ctaRegister}
              </Link>
              <Link to="/app/dashboard" className="glass-card hover:bg-white/10 text-white font-bold py-4 px-8 rounded-2xl transition border border-white/10 text-center">
                {t.hero.ctaDemo}
              </Link>
            </div>
          </div>

          {/* Interactive Feature Cards Panel */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                💱
              </div>
              <h3 className="font-bold text-white text-lg">{lang === "th" ? "การค้าไร้เงินตรา" : "B2B Barter Commerce"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === "th"
                  ? "แลกเปลี่ยนสินค้าและบริการแบบไร้เงินสดโดยใช้ Unicorn Credits (UNC) เป็นตัวกลาง สะดวก และมีความคล่องตัวสูง"
                  : "Exchange products and services cashless using Unicorn Credits (UNC) as a trusted medium of trade exchange."}
              </p>
            </div>
            <div className="glass-card p-6 rounded-3xl space-y-4 lg:translate-y-6">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary text-xl font-bold">
                🤖
              </div>
              <h3 className="font-bold text-white text-lg">{lang === "th" ? "ระบบจับคู่ AI อัจฉริยะ" : "AI Smart Matchmaking"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === "th"
                  ? "ค้นหาและวิเคราะห์ข้อเสนอที่มีความต้องการตรงกันในระดับสากลโดยการจับคู่ความต้องการเชิงปริมาณและเวกเตอร์ของ AI"
                  : "Analyze and discover matching trade opportunities globally using semantic vectors and deep matching algorithms."}
              </p>
            </div>
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl font-bold">
                🔒
              </div>
              <h3 className="font-bold text-white text-lg">{lang === "th" ? "ระบบค้ำประกัน Escrow" : "Secure Escrow Protection"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === "th"
                  ? "ล็อกหน่วยเครดิตไว้ในระบบค้ำประกันกลางอย่างปลอดภัยจนกว่าคู่ค้าทั้งสองฝ่ายจะได้รับมอบงานและตรวจสอบสำเร็จ"
                  : "Secure transactional trust by locking trade credits in our system until both parties complete product delivery."}
              </p>
            </div>
            <div className="glass-card p-6 rounded-3xl space-y-4 lg:translate-y-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 text-xl font-bold">
                🌍
              </div>
              <h3 className="font-bold text-white text-lg">{lang === "th" ? "เชื่อมโยงสมาคมการค้า" : "Global Trade Affiliations"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === "th"
                  ? "ร่วมงาน B2B ร่วมกับหอการค้า สมาคมการค้า และกลุ่มนักลงทุนทั้งในสหรัฐอเมริกา ประเทศไทย และภูมิภาคอาเซียน"
                  : "Collaborate directly with global chambers, trade associations, and private enterprise networks."}
              </p>
            </div>
          </div>
        </div>

        {/* Global Statistics */}
        <section id="stats" className="mt-32 border-t border-white/5 pt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-white text-gradient-primary">50,000+</div>
              <div className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground">{lang === "th" ? "ผู้เข้าร่วมระบบ" : "Global Members"}</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-white text-gradient-secondary">10,000+</div>
              <div className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground">{lang === "th" ? "แบรนด์ได้รับการรับรอง" : "Verified Businesses"}</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-white text-gradient-amber">50+</div>
              <div className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground">{lang === "th" ? "สมาคมและหอการค้าพันธมิตร" : "Chamber Partners"}</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-white text-gradient-primary">100M+</div>
              <div className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground">{lang === "th" ? "มูลค่าการแลกเปลี่ยนสะสม" : "Credits Traded (UNC)"}</div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="mt-36 pt-16 border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold text-primary uppercase tracking-widest block">{t.about.subtitle}</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.about.title}</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16 items-center">
            <div className="space-y-6">
              <p className="text-base text-muted-foreground leading-relaxed">
                {t.about.desc1}
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                {t.about.desc2}
              </p>
              <div className="glass-card p-6 rounded-2xl border-l-4 border-primary">
                <p className="text-sm italic font-semibold text-white leading-relaxed">
                  {t.about.philosophy}
                </p>
              </div>
            </div>

            <div className="glass-card p-8 rounded-3xl space-y-6">
              <h3 className="text-xl font-bold text-white">{lang === "th" ? "ภารกิจหลักของเรา" : "Our Key Actions"}</h3>
              <ul className="space-y-4">
                {t.about.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Strategic Business Platform Section */}
        <section className="mt-36 pt-16 border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest block">{t.platform.subtitle}</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.platform.title}</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-secondary to-primary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16 items-center">
            <div className="lg:col-span-5 glass-card p-8 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold text-white">{t.platform.pointsTitle}</h3>
              <ul className="space-y-4">
                {t.platform.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-secondary/15 flex items-center justify-center text-secondary text-xs shrink-0 mt-0.5">
                      ★
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-2xl font-extrabold text-white">{t.platform.visionTitle}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {t.platform.visionDesc}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="glass-card p-5 rounded-2xl">
                  <h4 className="font-bold text-white text-sm mb-1">{lang === "th" ? "Modern Business" : "Modern Business"}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{lang === "th" ? "ระบบแลกเปลี่ยนการค้าสากล ยกระดับแบรนด์สู่ตลาดโลก" : "Global exchange platforms elevating brands internationally."}</p>
                </div>
                <div className="glass-card p-5 rounded-2xl">
                  <h4 className="font-bold text-white text-sm mb-1">{lang === "th" ? "Cross-Border Commerce" : "Cross-Border Commerce"}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{lang === "th" ? "รองรับการค้าระหว่างประเทศอย่างไร้รอยต่อ สะดวก รวดเร็ว" : "Support seamless cross-border commerce securely."}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Corporate Message (CEO Board) */}
        <section className="mt-36 pt-16 border-t border-white/5">
          <div className="glass-card p-8 md:p-12 rounded-3xl bg-gradient-to-br from-card/80 to-primary/5 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-4 flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-extrabold text-white text-3xl shadow-xl shadow-primary/10 border border-white/10">
                  UGC
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-lg">{t.ceo.author}</h4>
                  <p className="text-xs text-primary font-semibold tracking-wider uppercase">{t.ceo.role}</p>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <span className="text-xs font-bold text-primary uppercase tracking-widest block">{t.ceo.subtitle}</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white italic">
                  "{t.ceo.quote}"
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t.ceo.text}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Core Values Section */}
        <section id="values" className="mt-36 pt-16 border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold text-primary uppercase tracking-widest block">{t.values.subtitle}</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.values.title}</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-16">
            {t.values.list.map((val, idx) => (
              <div key={idx} className="glass-card p-6 rounded-2xl flex flex-col justify-between border-t-2 border-primary/20 hover:border-primary/80 transition-all duration-300">
                <div className="space-y-3">
                  <div className="text-primary font-black text-2xl">0{idx + 1}</div>
                  <h3 className="font-extrabold text-white text-base">{val.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{val.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Industries We Connect Section */}
        <section id="industries" className="mt-36 pt-16 border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest block">{t.industries.subtitle}</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.industries.title}</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-secondary to-primary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {t.industries.list.map((ind, idx) => (
              <div key={idx} className="glass-card p-6 rounded-2xl text-center flex flex-col items-center justify-center space-y-3 hover:translate-y-[-4px]">
                <div className="text-3xl">{ind.icon}</div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-white text-sm sm:text-base">{lang === "th" ? ind.name : ind.en}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{lang === "th" ? ind.en : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Corporate Statement Banner */}
        <section className="mt-36 pt-16 border-t border-white/5 text-center">
          <div className="max-w-4xl mx-auto space-y-6 py-12 px-6 rounded-3xl bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border border-white/5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {t.statement.text}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t.statement.sub}
            </p>
          </div>
        </section>

        {/* Partnership Section */}
        <section className="mt-36 pt-16 border-t border-white/5">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold text-primary uppercase tracking-widest block">{t.partnership.subtitle}</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{t.partnership.title}</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full" />
            <p className="text-sm text-muted-foreground max-lg mx-auto pt-2">{t.partnership.desc}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16 items-center">
            <div className="lg:col-span-5 glass-card p-8 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold text-white">{lang === "th" ? "พันธมิตรที่เรายินดีต้อนรับ" : "Partners We Welcome"}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {t.partnership.list.map((partner, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-center text-center">
                    <span className="text-xs font-bold text-white">{partner}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center italic">{t.partnership.cta}</p>
            </div>

            {/* Contact Form Section */}
            <div id="contact" className="lg:col-span-7 glass-card p-8 rounded-3xl space-y-6 border-t-4 border-secondary relative">
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">{t.contact.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.contact.desc}</p>
              </div>

              {submitted ? (
                <div className="p-8 bg-primary/10 border border-primary/20 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl mx-auto">
                    ✓
                  </div>
                  <p className="text-sm font-bold text-white">{t.contact.success}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="name" className="text-xs text-muted-foreground font-semibold">{t.contact.name}</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="company" className="text-xs text-muted-foreground font-semibold">{t.contact.company}</label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        required
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                        placeholder="Company LLC"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="email" className="text-xs text-muted-foreground font-semibold">{t.contact.email}</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="phone" className="text-xs text-muted-foreground font-semibold">{t.contact.phone}</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                        placeholder="+66 81 234 5678"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="message" className="text-xs text-muted-foreground font-semibold">{t.contact.message}</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition resize-none"
                      placeholder="Share your interest or inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-primary to-emerald-600 hover:opacity-95 text-white font-extrabold py-3.5 px-6 rounded-xl transition text-center shadow-lg shadow-primary/10"
                  >
                    {isSubmitting ? t.contact.sending : t.contact.submit}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 py-12 px-6 md:px-12 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white text-sm">
                U
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">UNICORN</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Unicorn Global Commerce LLC — B2B Modern Barter & Cross-Border Commerce Solutions connecting US, Thailand, and ASEAN markets.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{lang === "th" ? "ลิงก์ด่วน" : "Quick Links"}</h4>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <a href="#about" className="hover:text-white transition">{t.nav.about}</a>
              <a href="#values" className="hover:text-white transition">{t.nav.values}</a>
              <a href="#industries" className="hover:text-white transition">{t.nav.industries}</a>
              <a href="#contact" className="hover:text-white transition">{t.nav.contact}</a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{lang === "th" ? "ข้อมูลการติดต่อ" : "Corporate Office"}</h4>
            <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>🇺🇸 **Unicorn Global Commerce LLC** (USA)</p>
              <p>🇹🇭 **Unicorn Global Link** (Thailand)</p>
              <p>🌐 [unicorngloballink.com](https://unicorngloballink.com)</p>
              <p>📧 contract.global@gmail.com</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
          <p>© 2026 Unicorn Global Commerce LLC. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/auth/login" className="hover:text-white transition">Sign In</Link>
            <Link to="/auth/register" className="hover:text-white transition">Register Business</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
