import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldCheck, Building2, Search, FileBadge, ArrowRight, Lock, Zap, TrendingUp, BarChart3, BadgeCheck, QrCode, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import banner1 from "@/assets/banner-1.png";
import banner2 from "@/assets/banner-2.png";
import banner3 from "@/assets/banner-3.png";
import logoUtm from "@/assets/logos/utm.png";
import logoUm from "@/assets/logos/um.png";
import logoUkm from "@/assets/logos/ukm.png";
import logoUsm from "@/assets/logos/usm.png";
import logoUpm from "@/assets/logos/upm.png";
import logoUitm from "@/assets/logos/uitm.png";

const SLIDES = [
  {
    image: banner1,
    eyebrow: "Trusted by Malaysian universities & employers",
    title: <>The trusted source-of-truth for <span className="text-success">academic certificates</span> in Malaysia.</>,
    desc: "VerifyCert connects universities, employers and graduates on one platform — instant, tamper-evident, audit-ready verification reports.",
  },
  {
    image: banner2,
    eyebrow: "Verify in seconds. Hire with confidence.",
    title: <>Scan. Verify. <span className="text-success">Done.</span></>,
    desc: "From QR scan to official PDF report in under 2 seconds — straight from the issuing university's records.",
  },
  {
    image: banner3,
    eyebrow: "Built for employers & HR teams",
    title: <>Hire with <span className="text-success">confidence</span>. Verify before you sign.</>,
    desc: "Confirm every candidate's certificate against the issuing university — protect your business from credential fraud.",
  },
];

const Step = ({ n, icon: Icon, title, desc }: any) => (
  <div className="data-card p-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
      <span className="text-xs font-semibold tracking-wider text-muted-foreground">STEP {n}</span>
    </div>
    <h3 className="font-semibold mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{desc}</p>
  </div>
);

const Benefit = ({ icon: Icon, title, desc }: any) => (
  <div className="flex gap-3">
    <div className="h-9 w-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></div>
    <div>
      <h4 className="font-semibold mb-0.5">{title}</h4>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  </div>
);

export default function Landing() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);
  const go = (n: number) => setIdx((n + SLIDES.length) % SLIDES.length);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-primary-foreground" /></div>
            <span className="font-bold text-lg">VerifyCert</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm">
            <a href="#how" className="text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#universities" className="text-muted-foreground hover:text-foreground">For universities</a>
            <a href="#employers" className="text-muted-foreground hover:text-foreground">For employers</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button>
            <Button asChild><Link to="/register">Get started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero slider */}
      <section className="relative overflow-hidden bg-white border-b">
        <div className="relative h-[560px] lg:h-[620px]">
          {SLIDES.map((s, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? "opacity-100 z-[1]" : "opacity-0 pointer-events-none z-0"}`}
            >
              {/* Background image — same size & position for every slide */}
              <div className="absolute inset-0">
                <img src={s.image} alt="" className="w-full h-full object-cover object-right" />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/0" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/40 md:hidden" />
              </div>
              <div className="relative h-full max-w-7xl mx-auto px-4 lg:px-6 flex items-center">
                <div className="max-w-xl text-foreground">
                  <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs text-success font-medium mb-5">
                    <BadgeCheck className="h-3.5 w-3.5" /> {s.eyebrow}
                  </div>
                  <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.05] mb-5 tracking-tight text-foreground">
                    {s.title}
                  </h1>
                  <p className="text-base lg:text-lg text-muted-foreground mb-7 max-w-lg">
                    {s.desc}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" className="shadow-lg" asChild>
                      <Link to="/register">Verify a certificate <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link to="/login">Try the demo</Link>
                    </Button>
                  </div>
                  <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> HMAC-secured API</div>
                    <div className="flex items-center gap-2"><QrCode className="h-4 w-4 text-primary" /> QR validation</div>
                    <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Official PDF reports</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Slider controls */}
          <button
            aria-label="Previous slide"
            onClick={() => go(idx - 1)}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/80 hover:bg-white border shadow-md text-foreground z-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Next slide"
            onClick={() => go(idx + 1)}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/80 hover:bg-white border shadow-md text-foreground z-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${i === idx ? "w-8 bg-primary" : "w-2 bg-foreground/30 hover:bg-foreground/50"}`}
              />
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t bg-secondary/40">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { v: "12+", l: "Partner universities" },
              { v: "120k+", l: "Certificates indexed" },
              { v: "<2s", l: "Avg. verification time" },
              { v: "99.99%", l: "Uptime SLA" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-2xl lg:text-3xl font-bold text-foreground">{s.v}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logo cloud */}
      <section className="py-12 border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <p className="text-center text-xs uppercase tracking-wider text-muted-foreground mb-8">Built for Malaysia's leading institutions</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6 items-center justify-items-center">
            {[
              { name: "UTM", src: logoUtm },
              { name: "UM", src: logoUm },
              { name: "UKM", src: logoUkm },
              { name: "USM", src: logoUsm },
              { name: "UPM", src: logoUpm },
              { name: "UiTM", src: logoUitm },
            ].map((u) => (
              <img
                key={u.name}
                src={u.src}
                alt={`${u.name} logo`}
                loading="lazy"
                className="h-16 lg:h-20 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">How it works</h2>
            <p className="text-muted-foreground">A simple, transparent flow from data sync to verified report.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Step n="1" icon={Building2} title="University connects" desc="Universities sync graduate certificate data via secure API." />
            <Step n="2" icon={Search} title="Employer searches" desc="Hiring teams look up a candidate by certificate number or name." />
            <Step n="3" icon={Zap} title="Pay verification fee" desc="Pay a small flat fee per official verification." />
            <Step n="4" icon={FileBadge} title="Get official report" desc="Receive a tamper-evident PDF with QR code in seconds." />
          </div>
        </div>
      </section>



      <section id="employers" className="py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 grid lg:grid-cols-2 gap-12 items-start">
          <div className="grid sm:grid-cols-2 gap-5 order-2 lg:order-1">
            <Benefit icon={Zap} title="Faster hiring" desc="Verifications in seconds, not days of email chasing." />
            <Benefit icon={ShieldCheck} title="Reduce fraud risk" desc="Confirm certificates against the source institution." />
            <Benefit icon={FileText} title="Official PDF report" desc="Audit-ready report with verification reference number." />
            <Benefit icon={QrCode} title="QR-based validation" desc="Anyone can re-verify the report with a single scan." />
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-xs uppercase tracking-wider text-primary font-semibold">For Employers</span>
            <h2 className="text-3xl lg:text-4xl font-bold mt-2 mb-4">Hire with confidence. Verify in seconds.</h2>
            <p className="text-muted-foreground mb-6">Stop trusting unverified copies. Pull authoritative certificate data straight from the issuing university.</p>
            <Button asChild><Link to="/register">Create employer account</Link></Button>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 grid md:grid-cols-3 gap-6">
          {[
            { icon: Lock, title: "Bank-grade encryption", desc: "All data in transit secured with TLS. HMAC SHA-256 signed API calls." },
            { icon: ShieldCheck, title: "Source-of-truth data", desc: "Certificates sync directly from registrar systems — no middlemen." },
            { icon: BarChart3, title: "Full audit trail", desc: "Every verification, payment and certificate change is logged." },
          ].map((s, i) => (
            <div key={i} className="data-card p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3"><s.icon className="h-5 w-5" /></div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-secondary/40 border-y">
        <div className="max-w-3xl mx-auto px-4 lg:px-6">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-10">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="data-card px-6">
            <AccordionItem value="1"><AccordionTrigger>Is this an official Government platform?</AccordionTrigger><AccordionContent>VerifyCert is an independent platform that partners with Malaysian universities to provide source-of-truth verification.</AccordionContent></AccordionItem>
            <AccordionItem value="2"><AccordionTrigger>How long does verification take?</AccordionTrigger><AccordionContent>Verifications are returned instantly once payment is confirmed.</AccordionContent></AccordionItem>
            <AccordionItem value="3"><AccordionTrigger>How are universities paid?</AccordionTrigger><AccordionContent>Monthly settlement is processed by our finance team and reflected in the university dashboard.</AccordionContent></AccordionItem>
            <AccordionItem value="4"><AccordionTrigger>Do you support API integration?</AccordionTrigger><AccordionContent>Yes — we offer HMAC-signed sync endpoints and webhook callbacks. See the API Integration page in your university dashboard.</AccordionContent></AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 lg:px-6">
          <div className="rounded-2xl gradient-hero text-primary-foreground p-10 lg:p-14 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(152_70%_50%/0.25),transparent_50%)]" />
            <div className="relative grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-3">Ready to verify with confidence?</h2>
                <p className="text-white/85">Join hundreds of HR teams making faster, fraud-proof hiring decisions.</p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Button size="lg" variant="secondary" asChild><Link to="/register">Get started free</Link></Button>
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white" asChild><Link to="/login">Try demo</Link></Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-primary-foreground" /></div>
            <span>© {new Date().getFullYear()} VerifyCert. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
            <Link to="/register" className="hover:text-foreground">Register</Link>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
