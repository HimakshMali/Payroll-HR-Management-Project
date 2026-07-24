// import React from 'react';

// const LandingPage = ({ onViewChange }) => {
//     return (
//         <div style={{ padding: '20px' }}>
//             <h1>Enterprise Payroll Computational Engine</h1>
//             <p>A row-level isolated HR platform designed to manage payroll, employees, and organization accounts.</p>
//             <hr />
            
//             <h3>Select Access Vector:</h3>
//             <button type="button" onClick={() => onViewChange('login')}>
//                 Log In to Existing Node
//             </button>
            
//             <br /><br />
            
//             <button type="button" onClick={() => onViewChange('register')}>
//                 Register New Enterprise Organization
//             </button>
//         </div>
//     );
// };

// export default LandingPage;

// LandingPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import salzLogo from '../imports/Gemini_Generated_Image_32n9qv32n9qv32n9.png';
import '../style/landingpage.css';

/* ─── Root ─────────────────────────────────────────────── */
export default function LandingPage({ onViewChange }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="lp">
      <Navbar scrolled={scrolled} onViewChange={onViewChange} />
      <Hero onViewChange={onViewChange} />
      <LogoBar />
      <HowItWorks />
      <Features />
      <AgentDemo />
      <Stats />
      <Testimonials />
      <Pricing onViewChange={onViewChange} />
      <CTABanner onViewChange={onViewChange} />
      <Footer onViewChange={onViewChange} />
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────── */
function Navbar({ scrolled, onViewChange }) {
  return (
    <nav className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`}>
      <div className="lp-nav-inner">
        <a href="#" className="lp-logo">
          <img src={salzLogo} alt="Salz" className="lp-logo-img" />
        </a>
        <ul className="lp-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <div className="lp-nav-cta">
          <Link
            to="/login"
            className="lp-btn-ghost"
            onClick={(e) => {
              if (onViewChange) {
                onViewChange('login');
              }
            }}
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="lp-btn-primary"
            onClick={(e) => {
              if (onViewChange) {
                onViewChange('register');
              }
            }}
          >
            Register →
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero ───────────────────────────────────────────────── */
function Hero({ onViewChange }) {
  return (
    <section className="lp-hero">
      <div className="lp-hero-bg" />
      <div className="lp-hero-inner">
        <div className="lp-hero-left">
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            WhatsApp-Native HR Platform
          </div>
          <h1 className="lp-hero-h1">
            Run your entire HR<br />
            <span className="lp-hero-accent">from WhatsApp.</span>
          </h1>
          <p className="lp-hero-sub">
            Salz understands plain language. Mark attendance, process payroll,
            pay contractors, and manage your team — all from a single WhatsApp message.
          </p>
          <div className="lp-hero-btns">
            <Link to="/register" className="lp-btn-primary lp-btn-lg" onClick={() => onViewChange?.('register')}>
              Get Started Free →
            </Link>
            <Link to="/login" className="lp-btn-outline lp-btn-lg" onClick={() => onViewChange?.('login')}>
              Log in
            </Link>
          </div>
          <div className="lp-hero-stats">
            <span>2,000+ businesses</span>
            <span className="lp-dot-sep">·</span>
            <span>₹50Cr+ payroll/month</span>
            <span className="lp-dot-sep">·</span>
            <span>24/7 WhatsApp AI HR</span>
          </div>
        </div>
        <div className="lp-hero-right">
          <PhoneMockup />
          <div className="lp-float-card lp-float-card--tl">
            <div className="lp-float-icon">✓</div>
            <div>
              <div className="lp-float-label">Attendance</div>
              <div className="lp-float-val">Shreya — Absent</div>
            </div>
          </div>
          <div className="lp-float-card lp-float-card--br">
            <div className="lp-float-icon lp-float-icon--gold">₹</div>
            <div>
              <div className="lp-float-label">July Payroll</div>
              <div className="lp-float-val">₹12.4L processed</div>
            </div>
          </div>
          <div className="lp-float-card lp-float-card--tr">
            <div className="lp-float-icon">⚡</div>
            <div>
              <div className="lp-float-label">Payslips Sent</div>
              <div className="lp-float-val">Automated ✓</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Phone mockup ───────────────────────────────────────── */
function PhoneMockup() {
  return (
    <div className="lp-phone">
      <div className="lp-phone-notch" />
      <div className="lp-phone-screen">
        <div className="lp-wa-header">
          <div className="lp-wa-back">‹</div>
          <div className="lp-wa-avatar">S</div>
          <div className="lp-wa-info">
            <div className="lp-wa-name">Salz HR Agent</div>
            <div className="lp-wa-status">online</div>
          </div>
          <div className="lp-wa-dots">⋮</div>
        </div>
        <div className="lp-wa-messages">
          <div className="lp-bubble lp-bubble--sent lp-anim-1">
            Shreya didn&apos;t come today
          </div>
          <div className="lp-bubble lp-bubble--recv lp-anim-2">
            ✅ <strong>Shreya Sharma</strong> marked absent — Mon, 24 Jul.
          </div>
          <div className="lp-bubble lp-bubble--sent lp-anim-3">
            Rihyan took ₹3000 advance for medical
          </div>
          <div className="lp-bubble lp-bubble--recv lp-anim-4">
            ✅ ₹3,000 advance logged for <strong>Rihyan</strong>. Deducting from July payroll.
          </div>
          <div className="lp-bubble lp-bubble--sent lp-anim-5">
            Generate salary slips for this month
          </div>
          <div className="lp-typing lp-anim-6">
            <span /><span /><span />
          </div>
        </div>
        <div className="lp-wa-input">
          <div className="lp-wa-input-field">Type a message</div>
          <div className="lp-wa-send">▲</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Logo bar ───────────────────────────────────────────── */
function LogoBar() {
  const logos = ['Razorpay', 'Zoho Payroll', 'Flipkart', 'Swiggy', 'Meesho', 'OYO', 'Urban Company', 'Groww', 'PhonePe', 'CRED'];
  return (
    <div className="lp-logobar">
      <p className="lp-logobar-label">Trusted by 2,000+ businesses across India</p>
      <div className="lp-logobar-track-wrap">
        <div className="lp-logobar-track">
          {[...logos, ...logos].map((name, i) => (
            <span key={i} className="lp-logobar-item">{name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── How it works ───────────────────────────────────────── */
function HowItWorks() {
  const examples = [
    {
      tag: 'Attendance',
      sent: "Shreya didn't come today, mark her absent",
      recv: "✅ Shreya Sharma marked absent — Mon, 24 Jul. Attendance record updated.",
    },
    {
      tag: 'Advance & Reimbursement',
      sent: "Rihyan took ₹3000 advance for medical emergency",
      recv: "✅ ₹3,000 advance logged for Rihyan Mehta. Deducting from July salary. Ledger updated.",
    },
    {
      tag: 'Contractor Payment',
      sent: "Pay Raj Designs invoice — ₹25,000",
      recv: "✅ ₹25,000 sent to Raj Designs. TDS ₹2,500 (10%) auto-deducted. Invoice #INV-47 saved.",
    },
  ];

  return (
    <section id="how" className="lp-how">
      <div className="lp-container">
        <div style={{ textAlign: 'center' }}>
          <div className="lp-section-label">How it works</div>
          <h2 className="lp-section-h2">Just say it in WhatsApp.<br />Salz handles the rest.</h2>
          <p className="lp-section-sub">No forms. No dashboards to navigate. One message and your HR operations are done.</p>
        </div>
        <div className="lp-how-grid">
          {examples.map((ex, i) => (
            <div key={i} className="lp-how-card">
              <div className="lp-how-tag">{ex.tag}</div>
              <div className="lp-wa-mini">
                <div className="lp-bubble lp-bubble--sent">{ex.sent}</div>
                <div className="lp-bubble lp-bubble--recv">{ex.recv}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ───────────────────────────────────────────── */
function Features() {
  const features = [
    {
      icon: '💬',
      title: 'WhatsApp Integration',
      desc: "Connect Salz to your business WhatsApp number. Every plain-language message — attendance, advances, payroll commands — is understood, processed, and reflected instantly across all HR records.",
      size: 'large',
    },
    {
      icon: '📊',
      title: 'Reimbursement & Advance Ledger',
      desc: 'Track every advance and reimbursement in real-time. Auto-deduct from payroll at month-end with a full audit trail.',
      size: 'regular',
    },
    {
      icon: '📋',
      title: 'Attendance Tracker',
      desc: 'Log attendance via WhatsApp or app. Supports geo-fencing, half-day, late-mark, and shift policies.',
      size: 'regular',
    },
    {
      icon: '🤖',
      title: 'AI Payroll Engine',
      desc: "Auto-compute salaries with every allowance and deduction accounted for. Generate payslips in bulk and transfer via bank or UPI in one click.",
      size: 'large',
    },
    {
      icon: '📑',
      title: 'Contract Payment Manager',
      desc: 'Manage freelancer invoices and maintain a complete contractor payment history.',
      size: 'regular',
    },
    {
      icon: '📈',
      title: 'Team Analytics',
      desc: 'Headcount trends, salary spend breakdowns, and attendance heatmaps — all in a single live dashboard.',
      size: 'regular',
    },
  ];

  return (
    <section id="features" className="lp-features">
      <div className="lp-container">
        <div style={{ textAlign: 'center' }}>
          <div className="lp-section-label">Features</div>
          <h2 className="lp-section-h2">Everything HR. Nothing extra.</h2>
          <p className="lp-section-sub">Salz ships with every feature your people team needs — and nothing they don&apos;t.</p>
        </div>
        <div className="lp-features-grid">
          {features.map((f, i) => (
            <div key={i} className={`lp-feature-card lp-feature-card--${f.size}`}>
              <span className="lp-feature-icon">{f.icon}</span>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Agent Demo ─────────────────────────────────────────── */
function AgentDemo() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'recv', text: "Hi! I'm your Salz HR Agent. Ask me anything about your team." },
    { role: 'sent', text: 'Who has pending leave approvals?' },
    { role: 'recv', text: '3 employees have pending leaves: Ananya Sharma (2d), Karan Singh (1d), Priya Mehta (3d). Want me to approve all?' },
  ]);

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'sent', text: q }]);
    setTimeout(() => {
      setMessages(m => [
        ...m,
        { role: 'recv', text: "Done! I've processed your request and updated the records. Check the dashboard for details." },
      ]);
    }, 850);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') send();
  };

  return (
    <section className="lp-agent">
      <div className="lp-container">
        <div className="lp-agent-inner">
          <div className="lp-agent-left">
            <div className="lp-section-label">AI Agent</div>
            <h2 className="lp-section-h2 lp-text-left">Your HR team,<br />available 24/7.</h2>
            <p className="lp-section-sub lp-text-left">
              Access the full Salz AI Agent directly from the dashboard. No navigation needed —
              just chat to run reports, approve leaves, process payroll, or check salary status instantly.
            </p>
            <ul className="lp-agent-bullets">
              <li>✓ Run payroll for any department or team</li>
              <li>✓ Generate automated payslips</li>
              <li>✓ Approve or reject leave requests in bulk</li>
              <li>✓ Get instant salary breakdowns</li>
              <li>✓ Query attendance patterns across months</li>
            </ul>
          </div>
          <div className="lp-agent-right">
            <div className="lp-agent-chat">
              <div className="lp-agent-chat-header">
                <div className="lp-agent-avatar">🤖</div>
                <span>Salz Agent</span>
                <span className="lp-agent-live">● Live</span>
              </div>
              <div className="lp-agent-messages">
                {messages.map((m, i) => (
                  <div key={i} className={`lp-bubble lp-bubble--${m.role}`}>{m.text}</div>
                ))}
              </div>
              <div className="lp-agent-input-row">
                <input
                  className="lp-agent-input"
                  placeholder="Ask Salz anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                />
                <button className="lp-agent-send" onClick={send}>→</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ──────────────────────────────────────────────── */
function Stats() {
  const stats = [
    { val: '2,400+', label: 'Businesses on Salz' },
    { val: '₹50Cr+', label: 'Monthly payroll processed' },
    { val: '99.9%',  label: 'Platform uptime' },
    { val: '100%',   label: 'WhatsApp HR Automation' },
  ];

  return (
    <section className="lp-stats">
      <div className="lp-container">
        <div className="lp-stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="lp-stat">
              <div className="lp-stat-val">{s.val}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ───────────────────────────────────────── */
function Testimonials() {
  const testimonials = [
    {
      name: 'Aditya Verma',
      role: 'Founder, CafeHop',
      initial: 'A',
      body: "We run a 40-person food chain. Before Salz, payroll took 2 days. Now I send a WhatsApp message and it's done in 10 minutes. The WhatsApp automation saved us hours of manual HR work every week.",
    },
    {
      name: 'Sneha Rajput',
      role: 'HR Manager, TechBridge',
      initial: 'S',
      body: "The WhatsApp integration is magical. My team leads just message attendance updates naturally — no app to install, no training needed. Salz picks it all up and syncs instantly.",
    },
    {
      name: 'Pradeep Nair',
      role: 'CEO, BuildRight Contractors',
      initial: 'P',
      body: "Contract payment manager is a lifesaver. We pay 30+ contractors monthly. Invoice tracking and contractor payouts used to be a nightmare. Salz made it a 2-minute job.",
    },
  ];

  return (
    <section className="lp-testimonials">
      <div className="lp-container">
        <div style={{ textAlign: 'center' }}>
          <div className="lp-section-label">Testimonials</div>
          <h2 className="lp-section-h2">Businesses love Salz.</h2>
        </div>
        <div className="lp-testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="lp-testi-card">
              <p className="lp-testi-body">&ldquo;{t.body}&rdquo;</p>
              <div className="lp-testi-author">
                <div className="lp-testi-avatar">{t.initial}</div>
                <div>
                  <div className="lp-testi-name">{t.name}</div>
                  <div className="lp-testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ────────────────────────────────────────────── */
function Pricing({ onViewChange }) {
  const plans = [
    {
      name: 'Starter',
      price: '₹399',
      period: '/month',
      billedText: 'Charged quarterly (₹1,197 / quarter)',
      desc: 'Ideal for micro teams up to 10 employees.',
      features: [
        'Up to 10 employees',
        '50 WhatsApp messages / day',
        'WhatsApp HR Agent access',
        'Attendance & leave tracking',
        'Automated payslip generation',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Growth',
      price: '₹799',
      period: '/month',
      billedText: 'Charged quarterly (₹2,397 / quarter)',
      desc: 'Ideal for growing teams up to 25 employees.',
      features: [
        'Up to 25 employees',
        'WhatsApp HR Agent access',
        'Advance & reimbursement ledger',
        'Attendance & shift management',
        'Unlimited contractor payouts',
        'Priority WhatsApp support',
      ],
      cta: 'Get Started',
      highlighted: true,
    },
    {
      name: 'Custom',
      price: '₹1,200',
      period: 'base / month',
      billedText: 'Base fee includes up to 50 employees',
      desc: 'Scalable pricing for teams over 50 employees.',
      features: [
        'Up to 50 employees included in base fee',
        '+ ₹30 / month per new additional employee',
        '10 WhatsApp messages per employee / day (up to 500/day for base)',
        'Custom WhatsApp AI agent rules',
        'Full team analytics & export',
        'Dedicated account manager',
      ],
      cta: 'Get Custom Plan',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="lp-pricing">
      <div className="lp-container">
        <div style={{ textAlign: 'center' }}>
          <div className="lp-section-label">Pricing</div>
          <h2 className="lp-section-h2">Simple, transparent pricing.</h2>
          <p className="lp-section-sub">Flat quarterly billing & clear per-employee scalability.</p>
        </div>
        <div className="lp-pricing-grid">
          {plans.map((plan, i) => (
            <div key={i} className={`lp-price-card${plan.highlighted ? ' lp-price-card--highlighted' : ''}`}>
              {plan.highlighted && <div className="lp-price-popular">Most Popular</div>}
              <div className="lp-price-name">{plan.name}</div>
              <div className="lp-price-amount">
                <span className="lp-price-val">{plan.price}</span>
                <span className="lp-price-period">{plan.period}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', margin: '8px 0 16px 0' }}>
                {plan.billedText}
              </div>
              <p className="lp-price-desc">{plan.desc}</p>
              <ul className="lp-price-features">
                {plan.features.map((f, j) => (
                  <li key={j}><span className="lp-check">✓</span> {f}</li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`lp-btn-price ${plan.highlighted ? 'lp-btn-primary' : 'lp-btn-outline'}`}
                onClick={() => onViewChange?.('register')}
              >{plan.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────── */
function CTABanner({ onViewChange }) {
  return (
    <section className="lp-cta">
      <div className="lp-container">
        <div className="lp-cta-inner">
          <h2 className="lp-cta-h2">Start managing HR from WhatsApp today.</h2>
          <p className="lp-cta-sub">No setup fees. Free for the first month. No credit card required.</p>
          <div className="lp-cta-btns">
            <Link to="/register" className="lp-btn-white" onClick={() => onViewChange?.('register')}>
              Register Free
            </Link>
            <Link to="/login" className="lp-btn-ghost-white" onClick={() => onViewChange?.('login')}>
              Log in to Account →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────── */
function Footer({ onViewChange }) {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <img src={salzLogo} alt="Salz" className="lp-footer-logo" />
            <p className="lp-footer-tagline">HR & Payroll that runs on WhatsApp.</p>
          </div>
          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Account</div>
              <Link to="/login" onClick={() => onViewChange?.('login')}>Log in</Link>
              <Link to="/register" onClick={() => onViewChange?.('register')}>Register Organization</Link>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Product</div>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Company</div>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2024 Salz Technologies Pvt. Ltd.</span>
          <span>Made with ♥ in India 🇮🇳</span>
        </div>
      </div>
    </footer>
  );
}