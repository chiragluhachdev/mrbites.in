import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { portalUrl } from '../portal';
import {
  Clock, Store, CreditCard, ChevronRight, ChevronDown, Smartphone, Search,
  CheckCircle2, Menu, X, Heart, Star, MapPin, Home, ShoppingBag, ShoppingCart,
  Bell, ShieldCheck, GraduationCap, Building2, Users, Zap, ArrowRight, Mail,
} from 'lucide-react';
import { Instagram, Linkedin, Twitter, Facebook } from './SocialIcons';
import { motion } from 'framer-motion';

/* MR BITES brand palette (the deep campus green + gold from the mark). Kept as
   explicit values here because the shared Tailwind `brand-*` scale is emerald,
   used by the admin/vendor apps — the marketing site owns its own colour. */
const GREEN = '#056548';
const GREEN_DARK = '#043D2C';

/* The MR BITES wordmark as text — MR in the deep campus green, BITES in the
   logo's gold. `onDark` lifts the green so it stays legible on dark surfaces. */
export const Wordmark = ({ className = '', onDark = false }) => (
  <span className={`font-extrabold tracking-tight ${className}`}>
    <span className={onDark ? 'text-emerald-400' : 'text-[#056548]'}>MR</span>{' '}
    <span className="text-[#F5A623]">BITES</span>
  </span>
);

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#campuses', label: 'For campuses' },
  { href: '#faq', label: 'FAQ' },
];

const FAQS = [
  {
    q: 'What is MR BITES?',
    a: 'MR BITES is a campus food ordering platform. Students pre-order from their campus cafés and food courts, pay online, and pick up the moment the food is ready — no queues, no cash, no waiting around.',
  },
  {
    q: 'Which campuses can use MR BITES?',
    a: 'Any institution with on-site food outlets — universities, colleges, schools, hostels, corporate campuses and institutional food courts. MR BITES is built to work for a single café or a whole food court.',
  },
  {
    q: 'How do students pay?',
    a: 'Payments are online and prepaid, via UPI, cards and net banking through a secure gateway. Orders are confirmed only after the payment is verified, so there is never any confusion at the counter.',
  },
  {
    q: 'Are there any hidden fees for students?',
    a: 'No. Students pay the menu price — MR BITES adds no platform fee, service charge or markup. What you see on the menu is what you pay.',
  },
  {
    q: 'How do I bring MR BITES to my campus or cafeteria?',
    a: 'Reach out through our Partner With Us page. We set up your outlet, import your menu, and give you a live dashboard to manage orders — usually within a day.',
  },
  {
    q: 'Is my payment and data secure?',
    a: 'Yes. Payments run through a PCI-compliant gateway and are verified on our servers before an order is placed. We never store card details, and personal data is handled per our Privacy Policy.',
  },
];

/* ----------------------------------------------------------------- Navbar */

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-2.5' : 'bg-transparent py-4'
      }`}
    >
      <nav className="container mx-auto px-4 md:px-6" aria-label="Primary">
        <div className="flex items-center justify-between">
          <a href="#top" className="flex items-center gap-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#056548]" aria-label="MR BITES home">
            {/* The logo mark, sized larger than the bar and pulled with a
                negative margin so it overlaps the nav for a premium badge look,
                without stretching the bar's height. The wordmark sits beside it. */}
            <img
              src="/weblogotrp.png"
              alt=""
              width="150"
              height="163"
              className={`w-auto object-contain transition-all duration-300 ${scrolled ? 'h-10 -my-1.5' : 'h-12 md:h-14 -my-2 md:-my-3'}`}
            />
            <Wordmark className="text-lg md:text-xl" />
          </a>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-semibold text-gray-600 hover:text-[#056548] transition-colors">
                {l.label}
              </a>
            ))}
            <Link
              to="/contact"
              className="bg-[#056548] hover:bg-[#043D2C] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#056548]"
            >
              Partner with us
            </Link>
          </div>

          <button
            className="md:hidden p-2 -mr-2 text-gray-900 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#056548]"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex flex-col gap-1"
          >
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-2.5 px-2 rounded-lg text-gray-700 font-semibold hover:bg-gray-50">
                {l.label}
              </a>
            ))}
            <Link to="/contact" onClick={() => setOpen(false)} className="mt-2 bg-[#056548] text-white px-5 py-3 rounded-xl font-bold text-center shadow">
              Partner with us
            </Link>
          </motion.div>
        )}
      </nav>
    </header>
  );
};

/* ------------------------------------------------------------------- Hero */

const AppButtons = ({ align = 'start' }) => (
  <div className={`flex flex-col sm:flex-row gap-3 justify-${align === 'center' ? 'center' : 'start'}`}>
    {[
      { store: 'App Store', sub: 'Coming soon' },
      { store: 'Google Play', sub: 'Coming soon' },
    ].map((b) => (
      <button
        key={b.store}
        type="button"
        aria-label={`${b.store} — coming soon`}
        className="group bg-gray-900 hover:bg-black text-white px-6 py-3.5 rounded-2xl flex items-center gap-3 transition-all hover:-translate-y-0.5 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
      >
        <Smartphone size={22} className="shrink-0" />
        <span className="text-left leading-none">
          <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-1">{b.sub}</span>
          <span className="block text-sm font-bold">{b.store}</span>
        </span>
      </button>
    ))}
  </div>
);

const Hero = () => (
  <section id="top" className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 bg-[#F4FBF7]">
    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#056548] opacity-[0.07] blur-3xl" aria-hidden="true" />
    <div className="absolute top-40 -left-24 w-80 h-80 rounded-full bg-[#F5A623] opacity-[0.08] blur-3xl" aria-hidden="true" />

    <div className="container mx-auto px-4 md:px-6 relative">
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full lg:w-1/2 text-center lg:text-left"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-[#056548]/10 text-[#056548] text-xs font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#056548]" />
            </span>
            Now onboarding campuses
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-gray-900 mb-5">
            Skip the queue.<br />
            <span className="text-[#056548]">Pre-order campus food.</span>
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
            MR BITES lets students order ahead from their campus cafés and food courts, pay online, and pick up
            the moment it&apos;s ready — no lines, no cash, no waiting around.
          </p>

          <AppButtons />

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-gray-600">
            {['No student fees', 'Secure prepaid payments', 'Live order tracking'].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={16} className="text-[#056548]" /> {t}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full lg:w-1/2 flex justify-center relative"
        >
          <PhoneMock />
          <div
            className="hidden sm:flex absolute top-16 -right-2 md:right-6 bg-white p-3.5 rounded-2xl shadow-xl items-center gap-3 animate-bounce"
            style={{ animationDuration: '3s' }}
            aria-hidden="true"
          >
            <div className="bg-[#056548]/10 p-2 rounded-full text-[#056548]"><Bell size={20} /></div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none mb-1">Order ready!</p>
              <p className="text-xs text-gray-500 leading-none">Pick up at Counter 2</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

/* Phone mock — a faithful, decorative preview of the real MR BITES app. */
const OUTLETS = [
  { name: 'Burger Eats', loc: 'Food Court, Block B', rating: '4.6', closed: true },
  { name: 'Nescafé Corner', loc: 'Block C, Ground Floor', rating: '4.4', time: '8 MIN', img: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=70&w=140' },
  { name: 'Chai Garam', loc: 'Near Library Lawn', rating: '4.7', time: '6 MIN', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=70&w=140' },
];

const PhoneMock = () => (
  <div className="relative w-[272px] h-[566px] bg-gray-900 rounded-[42px] border-[9px] border-gray-900 shadow-2xl overflow-hidden" role="img" aria-label="MR BITES app preview showing campus outlets">
    <div className="absolute inset-0 bg-[#F4F5F7] flex flex-col">
      {/* Green header */}
      <div className="bg-[#056548] px-4 pt-6 pb-9 relative shrink-0">
        <span className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white text-[10px] font-bold">C</span>
        <p className="text-center text-[19px] font-extrabold tracking-tight leading-none">
          <span className="text-white">MR</span> <span className="text-[#F5A623]">BITES</span>
        </p>
        <p className="text-center text-[10px] text-white/80 font-semibold mt-1.5">Order ahead. Skip the queue.</p>
      </div>

      {/* Search bar — pulled up over the header in normal flow, so it is never
          clipped by the scroll area below. */}
      <div className="px-3 -mt-5 relative z-20 shrink-0">
        <div className="h-10 bg-white rounded-xl shadow-md flex items-center px-3">
          <Search size={14} className="text-gray-400 mr-2 shrink-0" />
          <span className="text-[11px] text-gray-400 font-medium">Search restaurants or locations…</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-3 overflow-hidden">
        <div className="pt-3 flex flex-col gap-2.5">
          {/* Favorites banner */}
          <div className="bg-[#FFF6EC] border border-[#FCE6CE] rounded-2xl p-2.5 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#FDE0E0] flex items-center justify-center shrink-0"><Heart size={16} className="text-[#EF4444]" fill="#EF4444" /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold text-gray-900 leading-tight">Your Favorites</p>
              <p className="text-[8px] text-gray-500 leading-tight mt-0.5">Tap ❤️ on dishes you love to save them for quick reorders!</p>
            </div>
            <span className="relative w-11 h-9 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center text-lg">🍲
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#056548] rounded-full flex items-center justify-center border-2 border-[#FFF6EC]"><ChevronRight size={9} className="text-white" /></span>
            </span>
          </div>

          {/* Nearby outlets */}
          <div className="flex justify-between items-end mt-0.5">
            <h3 className="text-[13px] font-extrabold text-gray-900">Nearby Outlets</h3>
            <span className="text-[9px] text-gray-400 font-semibold">4 places found</span>
          </div>

          {OUTLETS.map((o) => (
            <div key={o.name} className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-2.5">
              <div className="w-[54px] h-[54px] rounded-xl overflow-hidden shrink-0 relative bg-gray-100">
                {o.closed ? (
                  <span className="absolute inset-0 bg-gray-900 flex items-center justify-center text-white text-[8px] font-extrabold tracking-wide">CLOSED</span>
                ) : (
                  <img src={o.img} alt="" loading="lazy" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="flex justify-between items-start gap-1">
                  <h4 className="text-[12px] font-bold text-gray-900 truncate">{o.name}</h4>
                  <span className="flex items-center bg-[#FEF3C7] px-1.5 py-0.5 rounded-md text-[9px] font-bold text-[#B45309] shrink-0"><Star size={9} fill="currentColor" className="mr-0.5" /> {o.rating}</span>
                </div>
                <p className="text-[9px] text-gray-500 flex items-center"><MapPin size={9} className="mr-0.5 shrink-0" /> {o.loc}</p>
                <div className="flex justify-between items-center">
                  {o.closed ? (
                    <span className="flex items-center gap-1 text-[8px] font-bold text-[#EF4444] uppercase"><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" /> Closed</span>
                  ) : (
                    <span className="flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-md"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" /><span className="text-[8px] font-bold text-emerald-600 uppercase">{o.time}</span></span>
                  )}
                  {!o.closed && <span className="w-5 h-5 bg-gray-50 rounded-full flex items-center justify-center"><ChevronRight size={12} className="text-gray-400" /></span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav with centre FAB */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#056548] rounded-full flex items-center justify-center shadow-lg border-[3px] border-white z-10">
          <ShoppingBag size={19} className="text-white" />
        </div>
        <div className="bg-white/95 backdrop-blur-md rounded-3xl h-[50px] flex items-center justify-between px-5 shadow-[0_8px_24px_rgba(0,0,0,0.1)] border border-gray-100">
          <span className="flex flex-col items-center"><Home size={17} className="text-[#056548]" fill="#056548" /><span className="w-1 h-1 rounded-full bg-[#056548] mt-0.5" /></span>
          <Search size={17} className="text-gray-400" />
          <span className="w-8" />
          <span className="relative"><ShoppingCart size={17} className="text-gray-400" /><span className="absolute -top-1.5 -right-1.5 bg-[#EF4444] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white text-[6px] font-bold text-white">1</span></span>
          <Heart size={17} className="text-gray-400" />
        </div>
      </div>
    </div>
  </div>
);

/* --------------------------------------------------------------- Trust bar */

const TrustBar = () => (
  <section className="bg-white border-y border-gray-100" aria-label="Highlights">
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          { icon: <Zap size={20} />, label: 'Order in seconds' },
          { icon: <ShieldCheck size={20} />, label: 'Secure prepaid' },
          { icon: <Bell size={20} />, label: 'Ready alerts' },
          { icon: <Store size={20} />, label: 'Every campus outlet' },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2">
            <span className="w-11 h-11 rounded-xl bg-[#056548]/8 text-[#056548] flex items-center justify-center">{s.icon}</span>
            <span className="text-sm font-semibold text-gray-700">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* --------------------------------------------------------------- Features */

const Features = () => {
  const items = [
    { icon: <Clock size={26} />, title: 'Pre-order & skip lines', desc: 'Order between classes and walk straight to the counter. No more losing your whole break to a queue.' },
    { icon: <Bell size={26} />, title: 'Live order tracking', desc: 'Watch your order move from accepted to ready, and get pinged the moment it can be collected.' },
    { icon: <CreditCard size={26} />, title: 'Cashless & secure', desc: 'Pay by UPI, card or net banking. Orders confirm only after payment is verified on our servers.' },
    { icon: <Store size={26} />, title: 'Every outlet, one app', desc: 'Cafés, canteens and food courts across your campus — browse and order from all of them in one place.' },
    { icon: <ShieldCheck size={26} />, title: 'No student fees', desc: 'You pay the menu price and nothing more. No platform fee, no service charge, no surprises at checkout.' },
    { icon: <Users size={26} />, title: 'Order for the group', desc: 'Grab lunch for the whole table in a single order and pick it all up together.' },
  ];
  return (
    <section id="features" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="text-sm font-bold uppercase tracking-wider text-[#056548] mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">Everything students need</h2>
          <p className="text-lg text-gray-600">Campus dining, without the friction. Built around how students actually eat between classes.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: (i % 3) * 0.08 }}
              className="p-7 rounded-3xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-[#056548]/20 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#056548]/8 text-[#056548] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600 leading-relaxed">{f.desc}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------ How it works */

const HowItWorks = () => {
  const steps = [
    { n: '01', t: 'Browse', d: 'Open MR BITES and pick from every open outlet on your campus.' },
    { n: '02', t: 'Order & pay', d: 'Add your items, customise them, and pay securely online.' },
    { n: '03', t: 'Track', d: 'Follow your order live — accepted, preparing, ready.' },
    { n: '04', t: 'Pick up', d: 'Get the ready alert, walk up, and collect. No queue.' },
  ];
  return (
    <section id="how-it-works" className="py-20 md:py-28 relative overflow-hidden" style={{ background: GREEN_DARK }}>
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#056548] opacity-40 blur-3xl" aria-hidden="true" />
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="text-sm font-bold uppercase tracking-wider text-[#F5A623] mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">From craving to counter in four taps</h2>
          <p className="text-lg text-white/70">No app-store jargon. Just food, faster.</p>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <li key={s.n} className="relative">
              {i < steps.length - 1 && <span className="hidden md:block absolute top-9 left-[calc(50%+2.5rem)] right-0 border-t-2 border-dashed border-white/20" aria-hidden="true" />}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <span className="w-[72px] h-[72px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-extrabold text-[#F5A623] mb-5">{s.n}</span>
                <h3 className="text-lg font-bold text-white mb-2">{s.t}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{s.d}</p>
              </motion.div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

/* --------------------------------------------------------------- Campuses */

const Campuses = () => {
  const cards = [
    {
      icon: <GraduationCap size={24} />,
      title: 'For students',
      points: ['Order ahead, skip the queue', 'Pay online — no cash needed', 'Get notified when it’s ready'],
      cta: { label: 'Get the app', to: null },
    },
    {
      icon: <Store size={24} />,
      title: 'For cafeterias & food courts',
      points: ['A live dashboard for every order', 'Fewer counter crowds, faster service', 'Keep 100% of the menu price'],
      cta: { label: 'Partner with us', to: '/contact' },
    },
    {
      icon: <Building2 size={24} />,
      title: 'For universities & institutions',
      points: ['One platform for every outlet', 'Cashless, trackable campus dining', 'Set up in days, not months'],
      cta: { label: 'Request a demo', to: '/contact' },
    },
  ];
  return (
    <section id="campuses" className="py-20 md:py-28 bg-[#F4FBF7]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="text-sm font-bold uppercase tracking-wider text-[#056548] mb-3">Built for everyone on campus</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">One platform, three wins</h2>
          <p className="text-lg text-gray-600">Whether you eat on campus, run an outlet, or run the campus — MR BITES fits.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <div key={c.title} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow p-8 flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-[#056548]/8 text-[#056548] flex items-center justify-center mb-6">{c.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{c.title}</h3>
              <ul className="space-y-3 mb-8 flex-1">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-gray-600">
                    <CheckCircle2 size={18} className="text-[#056548] shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              {c.cta.to ? (
                <Link to={c.cta.to} className="inline-flex items-center justify-center gap-1.5 bg-[#056548] hover:bg-[#043D2C] text-white font-bold px-5 py-3 rounded-xl transition-colors">
                  {c.cta.label} <ArrowRight size={18} />
                </Link>
              ) : (
                <a href="#top" className="inline-flex items-center justify-center gap-1.5 border-2 border-[#056548] text-[#056548] hover:bg-[#056548] hover:text-white font-bold px-5 py-3 rounded-xl transition-colors">
                  {c.cta.label} <ArrowRight size={18} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------- Vendor CTA */

const VendorBand = () => (
  <section className="py-20 md:py-28 bg-white">
    <div className="container mx-auto px-4 md:px-6">
      <div className="rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row" style={{ background: GREEN }}>
        <div className="w-full md:w-1/2 p-10 md:p-14 text-white">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold mb-6">
            <Store size={15} /> For outlet owners
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-5">Run your outlet on MR BITES</h2>
          <p className="text-white/85 text-lg leading-relaxed mb-8">
            Take orders before the rush hits, cut counter chaos, and keep every rupee of the menu price — MR BITES charges
            outlets no commission. Manage it all from one live dashboard.
          </p>
          <ul className="space-y-3 mb-9">
            {['Live orders, accept in one tap', 'Built-in counter POS for walk-ins', 'Daily sales, clearly reconciled'].map((t) => (
              <li key={t} className="flex items-center gap-3 font-medium"><CheckCircle2 size={20} className="text-[#FFF59D] shrink-0" /> {t}</li>
            ))}
          </ul>
          <button
            onClick={() => { window.location.href = portalUrl('vendor', '/login'); }}
            className="bg-white text-[#056548] hover:bg-[#FFF59D] px-7 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
          >
            Vendor login <ChevronRight size={20} />
          </button>
        </div>
        <div className="w-full md:w-1/2 relative min-h-[340px] flex items-center justify-center p-8">
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '26px 26px' }} aria-hidden="true" />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 rotate-[-3deg]">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
              <div>
                <p className="font-bold text-gray-900">Live orders</p>
                <p className="text-xs text-gray-500">Counter dashboard</p>
              </div>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">Online</span>
            </div>
            <div className="space-y-3">
              {[{ id: '8493', items: '2× Cold Coffee, 1× Wrap' }, { id: '8494', items: '1× Veg Sandwich' }].map((o) => (
                <div key={o.id} className="bg-gray-50 p-3.5 rounded-xl flex justify-between items-center border border-gray-100">
                  <div><p className="font-bold text-gray-900 text-sm">#{o.id}</p><p className="text-xs text-gray-500">{o.items}</p></div>
                  <span className="bg-[#056548] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold">Accept</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* -------------------------------------------------------------------- FAQ */

const Faq = () => {
  const [open, setOpen] = useState(0);
  const toggle = useCallback((i) => setOpen((cur) => (cur === i ? -1 : i)), []);
  return (
    <section id="faq" className="py-20 md:py-28 bg-[#F4FBF7]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-sm font-bold uppercase tracking-wider text-[#056548] mb-3">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Questions, answered</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <h3>
                <button
                  onClick={() => toggle(i)}
                  aria-expanded={open === i}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-bold text-gray-900 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#056548]"
                >
                  <span>{f.q}</span>
                  <ChevronDown size={20} className={`shrink-0 text-[#056548] transition-transform ${open === i ? 'rotate-180' : ''}`} />
                </button>
              </h3>
              {open === i && (
                <div className="px-5 pb-5 -mt-1 text-gray-600 leading-relaxed">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------------------------------------------------------------- Footer */

const Footer = () => {
  const year = new Date().getFullYear();
  const socials = [
    { icon: <Instagram size={18} />, href: 'https://instagram.com/mrbites.in', label: 'Instagram' },
    { icon: <Linkedin size={18} />, href: 'https://linkedin.com/company/mrbites', label: 'LinkedIn' },
    { icon: <Twitter size={18} />, href: 'https://x.com/mrbites', label: 'X' },
    { icon: <Facebook size={18} />, href: 'https://facebook.com/mrbites.in', label: 'Facebook' },
  ];
  const cols = [
    { title: 'Product', links: [{ l: 'Features', h: '#features' }, { l: 'How it works', h: '#how-it-works' }, { l: 'For campuses', h: '#campuses' }, { l: 'FAQ', h: '#faq' }] },
    { title: 'Company', links: [{ l: 'Partner with us', to: '/contact' }, { l: 'Contact', to: '/contact' }, { l: 'Careers — soon', h: '#', muted: true }, { l: 'Blog — soon', h: '#', muted: true }] },
    { title: 'Legal', links: [{ l: 'Privacy Policy', to: '/privacy' }, { l: 'Terms & Conditions', to: '/terms' }, { l: 'Refund Policy', to: '/refund' }, { l: 'Support', href: 'mailto:support@mrbites.in' }] },
  ];
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/weblogo.png" alt="MR BITES" width="36" height="36" className="w-9 h-9 object-contain bg-white rounded-lg p-0.5" />
              <Wordmark className="text-xl" onDark />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs mb-5">
              The campus food ordering platform. Pre-order, pay online, and skip the queue — for universities, colleges,
              schools and corporate campuses.
            </p>
            <div className="flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#056548] flex items-center justify-center text-gray-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#056548]"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{col.title}</h2>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((lk) => (
                  <li key={lk.l}>
                    {lk.to ? (
                      <Link to={lk.to} className="text-gray-400 hover:text-white transition-colors">{lk.l}</Link>
                    ) : (
                      <a href={lk.href || lk.h} className={`transition-colors ${lk.muted ? 'text-gray-600 cursor-default' : 'text-gray-400 hover:text-white'}`}>{lk.l}</a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {year} MR BITES. All Rights Reserved.</p>
          <p className="flex items-center gap-4">
            <a href="mailto:support@mrbites.in" className="inline-flex items-center gap-1.5 hover:text-white transition-colors"><Mail size={14} /> support@mrbites.in</a>
            <span className="hidden sm:inline text-gray-600">·</span>
            <span>A <span className="text-gray-300 font-semibold">Revera Technologies</span> product</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

/* ---------------------------------------------------------------- Page */

const LandingPage = () => (
  <div className="min-h-screen bg-white text-gray-900 antialiased selection:bg-[#056548]/15">
    <Navbar />
    <main>
      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <Campuses />
      <VendorBand />
      <Faq />
    </main>
    <Footer />
  </div>
);

export default LandingPage;
