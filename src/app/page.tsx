import React from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  ShieldCheck,
  Zap,
  Cpu,
  Headphones,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Shield,
  Clock,
  CheckCircle2,
  Award,
  FileText,
  Calculator,
  Wrench,
  Check,
  ArrowRight,
  Sparkles,
  Phone,
  MapPin,
  Mail,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      {/* ============================================================ */}
      {/* HERO SECTION                                                 */}
      {/* Deep navy-blue gradient background (#0A1D3B to #123466)       */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1D3B] via-[#0E2850] to-[#123466] text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Subtle background glow circles */}
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline, Description & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Sky-blue uppercase tracking text */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-sky-400/30 text-sky-300 text-xs font-bold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>FAST • RELIABLE • PROFESSIONAL</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                Amanuel Mobile and Computer{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-400 to-blue-400">
                  Maintenance
                </span>
              </h1>

              {/* Subtitle paragraph */}
              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
                Your trusted partner for mobile phones, tablets, laptops and desktop computer repair services. We keep your devices running smoothly.
              </p>

              {/* Two CTA buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/book-repair"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book a Repair</span>
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-transparent hover:bg-white/10 text-white font-semibold text-sm border border-white/30 hover:border-white transition-all"
                >
                  <span>View Services</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Bottom trust row with 4 icon badges */}
              <div className="pt-8 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-sky-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Expert Technicians
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-sky-300">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Fast Turnaround
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-sky-300">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Quality Parts
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-sky-300">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Customer Support
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Device Showcase & Badge */}
            <div className="lg:col-span-5 relative">
              {/* Floating Angled Badge */}
              <div className="absolute -top-6 -right-2 sm:-right-4 z-20 transform rotate-3 hover:rotate-0 transition-transform">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-4 py-2 rounded-xl shadow-xl font-extrabold text-xs tracking-tight border-2 border-white/40">
                  Any Device / Any Problem / We Fix It!
                </div>
              </div>

              {/* Showcase Card Grid */}
              <div className="relative rounded-3xl p-6 bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-md shadow-2xl space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Laptop Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60 hover:border-blue-400/60 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm font-bold text-white">Laptops</h2>
                    <p className="text-xs text-slate-300 mt-1">Screen, battery, motherboard, SSD upgrade</p>
                  </div>

                  {/* Smartphone Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60 hover:border-blue-400/60 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm font-bold text-white">Smartphones</h2>
                    <p className="text-xs text-slate-300 mt-1">OLED displays, batteries, charging ports</p>
                  </div>

                  {/* Tablet Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60 hover:border-blue-400/60 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Tablet className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm font-bold text-white">Tablets & iPads</h2>
                    <p className="text-xs text-slate-300 mt-1">Digitizers, screen glass, cameras & power</p>
                  </div>

                  {/* Desktop Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60 hover:border-blue-400/60 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm font-bold text-white">Desktop PCs</h2>
                    <p className="text-xs text-slate-300 mt-1">Power supplies, OS repair, deep cleaning</p>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-xs font-medium text-slate-300">
                    Fast diagnostic check-in available daily in Alamata, Tigray
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* "OUR SERVICES" SECTION (White Background)                     */}
      {/* ============================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-blue-600 tracking-widest uppercase">
                OUR SERVICES
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F294A] mt-2 tracking-tight">
                We Repair All Major Devices
              </h2>
            </div>
            <Link
              href="/services"
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 group"
            >
              <span>View All Services</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 4 Pastel-Tinted Horizontal Device Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Mobile Phones (#EEF6FF) */}
            <div className="p-6 rounded-2xl bg-[#EEF6FF] border border-blue-100 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0F294A]">Mobile Phones</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Screen, battery, charging port, camera, software and more.
                </p>
              </div>
              <div className="pt-6 flex justify-end">
                <Link
                  href="/services?category=MOBILE_PHONE"
                  className="w-9 h-9 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-xs border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors"
                  aria-label="View mobile phone services"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 2: Tablets (#F1F0FF) */}
            <div className="p-6 rounded-2xl bg-[#F1F0FF] border border-indigo-100 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  <Tablet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0F294A]">Tablets</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Screen, battery, charging, camera and software.
                </p>
              </div>
              <div className="pt-6 flex justify-end">
                <Link
                  href="/services?category=TABLET"
                  className="w-9 h-9 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-xs border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors"
                  aria-label="View tablet services"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 3: Laptops (#ECFDF5) */}
            <div className="p-6 rounded-2xl bg-[#ECFDF5] border border-emerald-100 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  <Laptop className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0F294A]">Laptops</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Screen, keyboard, battery, OS, RAM/SSD and more.
                </p>
              </div>
              <div className="pt-6 flex justify-end">
                <Link
                  href="/services?category=LAPTOP"
                  className="w-9 h-9 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors"
                  aria-label="View laptop services"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 4: Desktop Computers (#FFF7ED) */}
            <div className="p-6 rounded-2xl bg-[#FFF7ED] border border-amber-100 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform">
                  <Monitor className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0F294A]">Desktop Computers</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Hardware, storage, power supply, OS and software.
                </p>
              </div>
              <div className="pt-6 flex justify-end">
                <Link
                  href="/services?category=DESKTOP_COMPUTER"
                  className="w-9 h-9 rounded-full bg-white text-amber-600 flex items-center justify-center shadow-xs border border-amber-200 hover:bg-amber-600 hover:text-white transition-colors"
                  aria-label="View desktop computer services"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4 FEATURE PILLARS STRIP (Soft gray-blue #F8FAFC)              */}
      {/* ============================================================ */}
      <section className="py-12 bg-[#F8FAFC] border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:divide-x lg:divide-slate-200">
            {/* Pillar 1 */}
            <div className="flex items-center gap-4 lg:pr-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F294A]">Trusted Service</h4>
                <p className="text-xs text-slate-500 mt-1">We deliver honest and reliable repair solutions.</p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex items-center gap-4 lg:px-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F294A]">Quick Turnaround</h4>
                <p className="text-xs text-slate-500 mt-1">Get your device back as soon as possible.</p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex items-center gap-4 lg:px-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F294A]">Original Parts</h4>
                <p className="text-xs text-slate-500 mt-1">We use high-quality and genuine parts.</p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="flex items-center gap-4 lg:pl-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F294A]">Experienced Team</h4>
                <p className="text-xs text-slate-500 mt-1">Skilled technicians with years of experience.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* "HOW IT WORKS" SECTION (White Background)                     */}
      {/* ============================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Intro Column */}
            <div className="lg:col-span-4 space-y-3">
              <span className="text-xs font-bold text-blue-600 tracking-widest uppercase">
                HOW IT WORKS
              </span>
              <h2 className="text-3xl font-extrabold text-[#0F294A] tracking-tight leading-snug">
                Get Your Device Repaired in 4 Simple Steps
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                Booking a repair is easy. Just follow the steps below and we&apos;ll take care of the rest.
              </p>
              <div className="pt-4">
                <Link
                  href="/book-repair"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
                >
                  <span>Start Repair Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right 4 Numbered Step Columns */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="relative p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                      1
                    </div>
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F294A]">Submit Request</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Tell us your device, problem and preferred time.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                      2
                    </div>
                    <Calculator className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F294A]">Get Quotation</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    We&apos;ll check and send you a price estimate.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                      3
                    </div>
                    <Wrench className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F294A]">Repair & Track</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Our technicians will fix it and you can track the progress.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                      4
                    </div>
                    <Check className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F294A]">Pick Up or Receive</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Get your device back, pay and enjoy your fully working device.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ABOUT & LOCATION ANCHOR SECTION (#about, #contact)            */}
      {/* ============================================================ */}
      <section id="about" className="py-16 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-blue-600 tracking-widest uppercase">
                ABOUT OUR WORKSHOP
              </span>
              <h2 className="text-3xl font-extrabold text-[#0F294A] tracking-tight">
                Quality Device Maintenance in Alamata
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Founded with a mission to bring transparent, certified, and rapid technology repair services to northern Ethiopia, Amanuel Mobile and Computer Maintenance provides component-level diagnostics, screen repairs, battery replacements, and operating system optimizations.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-2xl font-black text-blue-600">100%</div>
                  <div className="text-xs text-slate-500 mt-1">Itemized transparent quotations</div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-2xl font-black text-blue-600">6 Days</div>
                  <div className="text-xs text-slate-500 mt-1">Weekly in-shop customer support</div>
                </div>
              </div>
            </div>

            <div id="contact" className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
              <h3 className="text-xl font-bold text-[#0F294A]">Visit or Contact Us</h3>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900">Workshop Address</strong>
                    <span>Alamata, Tigray, Ethiopia</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900">Phone & Telegram Support</strong>
                    <a href="tel:+251914131094" className="hover:text-blue-600 transition-colors">
                      +251 91 413 1094
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900">Customer Inquiries</strong>
                    <a href="mailto:kalilhida24@gmail.com" className="hover:text-blue-600 transition-colors">
                      kalilhida24@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/services"
                  className="block text-center w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-colors"
                >
                  Explore All Available Services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
