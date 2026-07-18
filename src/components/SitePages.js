import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Store } from 'lucide-react';
import { Instagram, Linkedin, Twitter } from './SocialIcons';

const SUPPORT = 'support@mrbites.in';
const COMPANY = 'Revera Studio';
const EFFECTIVE = 'July 2026';

/* Sets a per-page title and meta description. The homepage's rich tags live in
   index.html; these secondary pages just need Google to see a distinct title
   and summary when it renders the SPA. */
const useSeo = (title, description) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    let desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc ? desc.getAttribute('content') : null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.setAttribute('name', 'description');
      document.head.appendChild(desc);
    }
    desc.setAttribute('content', description);

    // Point the canonical at this exact page, not the homepage that index.html
    // hard-codes — otherwise every sub-page claims the homepage as its canonical.
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevHref = canonical ? canonical.getAttribute('href') : null;
    if (canonical) canonical.setAttribute('href', `https://mrbites.in${window.location.pathname}`);

    window.scrollTo(0, 0);
    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) desc.setAttribute('content', prevDesc);
      if (canonical && prevHref) canonical.setAttribute('href', prevHref);
    };
  }, [title, description]);
};

const Shell = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-white text-gray-900 antialiased">
    <header className="border-b border-gray-100 bg-white">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#056548]" aria-label="MR BITES home">
          <img src="/weblogo.png" alt="MR BITES" width="36" height="36" className="w-8 h-8 object-contain" />
          <span className="text-lg font-extrabold tracking-tight">MR BITES</span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#056548]">
          <ArrowLeft size={16} /> Back to home
        </Link>
      </div>
    </header>

    <main className="container mx-auto px-4 md:px-6 py-12 md:py-16 max-w-3xl">
      <nav aria-label="Breadcrumb" className="text-xs font-semibold text-gray-400 mb-4">
        <Link to="/" className="hover:text-[#056548]">Home</Link> <span className="mx-1">/</span> <span className="text-gray-600">{title}</span>
      </nav>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{title}</h1>
      {subtitle && <p className="text-gray-500 mb-8">{subtitle}</p>}
      <div className="prose-legal">{children}</div>
    </main>

    <footer className="border-t border-gray-100 py-8">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl flex flex-col sm:flex-row justify-between gap-3 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} MR BITES. All Rights Reserved.</p>
        <p>A <span className="font-semibold text-gray-700">{COMPANY}</span> product · <a href={`mailto:${SUPPORT}`} className="hover:text-[#056548]">{SUPPORT}</a></p>
      </div>
    </footer>
  </div>
);

const H2 = ({ children }) => <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">{children}</h2>;
const P = ({ children }) => <p className="text-gray-600 leading-relaxed mb-4">{children}</p>;
const UL = ({ children }) => <ul className="list-disc pl-5 space-y-2 text-gray-600 leading-relaxed mb-4">{children}</ul>;

export const PrivacyPage = () => {
  useSeo('Privacy Policy · MR BITES', 'How MR BITES collects, uses and protects your data on the campus food ordering platform.');
  return (
    <Shell title="Privacy Policy" subtitle={`Effective ${EFFECTIVE}`}>
      <P>MR BITES (“we”, “us”), operated by {COMPANY}, provides a campus food ordering platform. This policy explains what we collect, why, and the choices you have. By using MR BITES you agree to it.</P>
      <H2>Information we collect</H2>
      <UL>
        <li><strong>Account details</strong> — your mobile number (used to sign in via OTP) and the name you choose to add.</li>
        <li><strong>Order information</strong> — the items you order, the outlet, and order status, so we can fulfil and show your orders.</li>
        <li><strong>Payment information</strong> — payments are processed by our third-party gateway (Razorpay). We receive a confirmation of success and the last four digits only; <strong>we never store your full card or bank details.</strong></li>
        <li><strong>Device &amp; usage data</strong> — basic technical data needed to run the app securely and reliably.</li>
      </UL>
      <H2>How we use it</H2>
      <UL>
        <li>To create your account and place, track and display your orders.</li>
        <li>To send order-related notifications (for example, when your food is ready).</li>
        <li>To keep the service secure and prevent fraud and abuse.</li>
        <li>To provide support when you contact us.</li>
      </UL>
      <H2>What we do not do</H2>
      <P>We do not sell your personal data. We do not show third-party advertising. We share data only with the campus outlet fulfilling your order (your name and order) and with the payment gateway to process payment.</P>
      <H2>Data security &amp; retention</H2>
      <P>Payments run through a PCI-DSS-compliant gateway and are verified on our servers before an order is created. We retain order records for the outlet’s and platform’s accounting needs; you may delete your account at any time from the app, which requires OTP verification. Order records that belong to a vendor’s sales history are retained even after account deletion.</P>
      <H2>Your rights</H2>
      <P>You can update your name and phone number, or delete your account, from within the app. For any data request, email <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a>.</P>
      <H2>Contact</H2>
      <P>Questions about this policy? Email <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a>.</P>
    </Shell>
  );
};

export const TermsPage = () => {
  useSeo('Terms & Conditions · MR BITES', 'The terms that govern your use of MR BITES, the campus food ordering platform.');
  return (
    <Shell title="Terms & Conditions" subtitle={`Effective ${EFFECTIVE}`}>
      <P>These terms govern your use of MR BITES, operated by {COMPANY}. By using the platform you accept them.</P>
      <H2>The service</H2>
      <P>MR BITES lets students pre-order food from participating campus outlets and pay online. We connect students and outlets; the food is prepared and served by the outlet, not by MR BITES.</P>
      <H2>Accounts</H2>
      <P>You sign in with your mobile number and a one-time code. Keep your device secure. You are responsible for activity on your account.</P>
      <H2>Orders &amp; payments</H2>
      <UL>
        <li>Orders are prepaid. An order is confirmed only after the payment is verified.</li>
        <li>You pay the menu price. MR BITES adds no platform fee, service charge or markup to students.</li>
        <li>Prices, availability and outlet hours are set by each outlet and may change.</li>
        <li>An outlet may be unable to accept an order (closed, item unavailable); in that case you are not charged, or you are refunded per our <Link to="/refund">Refund Policy</Link>.</li>
      </UL>
      <H2>Acceptable use</H2>
      <P>Do not misuse the platform, attempt to disrupt it, place fraudulent orders, or use it for anything unlawful.</P>
      <H2>Liability</H2>
      <P>MR BITES facilitates ordering; the quality, safety and preparation of food are the responsibility of the outlet. To the extent permitted by law, MR BITES is not liable for indirect or consequential losses arising from use of the platform.</P>
      <H2>Governing law</H2>
      <P>These terms are governed by the laws of India. Disputes are subject to the courts of India.</P>
      <H2>Contact</H2>
      <P>Email <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a>.</P>
    </Shell>
  );
};

export const RefundPage = () => {
  useSeo('Refund & Cancellation Policy · MR BITES', 'How refunds and cancellations work for prepaid orders on MR BITES.');
  return (
    <Shell title="Refund & Cancellation Policy" subtitle={`Effective ${EFFECTIVE}`}>
      <P>Orders on MR BITES are prepaid. This policy explains when and how you are refunded.</P>
      <H2>When you are refunded</H2>
      <UL>
        <li><strong>The outlet cannot fulfil the order</strong> (closed, or an item is unavailable) — the order is not placed and the amount is refunded.</li>
        <li><strong>Payment succeeded but no order was created</strong> — our system retries automatically; if an order still cannot be created, the amount is refunded in full.</li>
        <li><strong>A duplicate charge</strong> — any duplicate is refunded in full.</li>
      </UL>
      <H2>When you are not refunded</H2>
      <P>Once an order has been prepared or collected, it cannot be refunded, as the food has been made for you. Please order carefully and check your items before paying.</P>
      <H2>How refunds are issued</H2>
      <P>Refunds are made to your original payment method through our payment gateway. They typically reach your account within <strong>5–7 business days</strong>, depending on your bank. You do not need to do anything for automatic refunds.</P>
      <H2>Need help?</H2>
      <P>If you were charged but did not get your order, or have any refund question, email <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a> with your registered number and we will sort it out quickly.</P>
    </Shell>
  );
};

export const ContactPage = () => {
  useSeo('Contact & Partner With Us · MR BITES', 'Bring MR BITES to your campus, cafeteria or food court — or get support. Contact the team.');
  const social = [
    { icon: <Instagram size={18} />, href: 'https://instagram.com/mrbites.in', label: 'Instagram' },
    { icon: <Linkedin size={18} />, href: 'https://linkedin.com/company/mrbites', label: 'LinkedIn' },
    { icon: <Twitter size={18} />, href: 'https://x.com/mrbites', label: 'X' },
  ];
  return (
    <Shell title="Contact & Partner With Us" subtitle="We usually reply the same day.">
      <P>Whether you want MR BITES at your campus, run a cafeteria or food court, or just need a hand — reach out. We set up new outlets fast: import your menu, hand you a live dashboard, and you are taking orders, often within a day.</P>

      <div className="grid sm:grid-cols-2 gap-4 not-prose my-8">
        <a href={`mailto:partnerships@mrbites.in`} className="block p-6 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:shadow-lg transition-all">
          <span className="w-11 h-11 rounded-xl bg-[#056548]/8 text-[#056548] flex items-center justify-center mb-4"><Store size={20} /></span>
          <h2 className="font-bold text-gray-900 mb-1">Partner with us</h2>
          <p className="text-sm text-gray-600 mb-3">Bring MR BITES to your campus or outlet.</p>
          <span className="text-sm font-bold text-[#056548]">partnerships@mrbites.in</span>
        </a>
        <a href={`mailto:${SUPPORT}`} className="block p-6 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:shadow-lg transition-all">
          <span className="w-11 h-11 rounded-xl bg-[#056548]/8 text-[#056548] flex items-center justify-center mb-4"><Mail size={20} /></span>
          <h2 className="font-bold text-gray-900 mb-1">Support</h2>
          <p className="text-sm text-gray-600 mb-3">Order help, refunds, or anything else.</p>
          <span className="text-sm font-bold text-[#056548]">{SUPPORT}</span>
        </a>
      </div>

      <H2>Follow MR BITES</H2>
      <div className="flex gap-2 not-prose">
        {social.map((s) => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-[#056548] text-gray-600 hover:text-white flex items-center justify-center transition-colors">
            {s.icon}
          </a>
        ))}
      </div>
    </Shell>
  );
};
