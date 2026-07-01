/* global React */
const { Card, Eyebrow, Badge, Avatar, Button } = window.ShuckerVCDesignSystem_35394f;

const wrap = { maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 32px' };

/* ---------- Strategy (dark feature band) ---------- */
function Strategy() {
  return (
    <section id="Strategy" style={{ background: 'var(--ink-900)', color: '#fff', padding: '88px 0' }}>
      <div style={wrap}>
        <Eyebrow color="inverse">Our Strategy</Eyebrow>
        <h2 className="sv-display" style={{ fontSize: 'clamp(2rem,3.6vw,3rem)', maxWidth: 880, margin: '18px 0 0' }}>
          We believe that focused founders build the strongest companies.
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1.1rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.74)', maxWidth: 760, margin: '24px 0 0' }}>
          shuckerVC invests in early-stage, U.S.-based B2B software companies. We are industry and
          technology agnostic and prefer technical founders targeting markets ripe for digital
          transformation. Our unique support model secures our place in oversubscribed funding
          rounds alongside top lead investors.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
          {['Pre-seed', 'Seed', 'B2B Software', 'AI-native', 'Co-invest'].map((t) => (
            <Badge key={t} variant="teal">{t}</Badge>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Real Value Added (3 numbered cards) ---------- */
function ValueAdd() {
  const items = [
    { n: '1', t: 'Time to Market', d: 'Bringing a product to market quickly is crucial, but founders often have to handle bookkeeping, hiring, and even cleaning.' },
    { n: '2', t: 'Founders Focus', d: 'shuckerVC founders save thousands of hours by delegating back-office duties to their dedicated Support Partner.' },
    { n: '3', t: 'Integrated Operations', d: 'Along with a full-time Support Partner, we provide playbooks, software, and access to expert professionals.' },
  ];
  return (
    <section id="RealValueAdded" style={{ background: 'var(--surface-muted)', padding: '88px 0' }}>
      <div style={wrap}>
        <Eyebrow>Real Value Added</Eyebrow>
        <h2 className="sv-display" style={{ fontSize: 'clamp(2rem,3.4vw,2.75rem)', maxWidth: 720, margin: '18px 0 8px', color: 'var(--ink-900)' }}>
          Founders focus on product &amp; customer, shuckerVC does the rest.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginTop: 40 }}>
          {items.map((it) => (
            <Card key={it.n} interactive>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1, color: 'var(--gold-500)' }}>{it.n}</span>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 600, margin: '14px 0 8px', color: 'var(--ink-900)' }}>{it.t}</h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>{it.d}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Team ---------- */
const TEAM = [
  { name: "Jean-Philippe 'JP' Persico", role: 'Managing Partner', img: '../../assets/team/jp-persico.jpg' },
  { name: 'Graham Siegel', role: 'Managing Partner', img: '../../assets/team/graham-siegel.jpeg' },
  { name: 'Gabe Regalado', role: 'Venture Partner', img: null },
  { name: 'Megan Liu', role: 'Support Partner', img: null },
];
function Team() {
  return (
    <section id="OurTeam" style={{ background: 'var(--surface-page)', padding: '88px 0' }}>
      <div style={wrap}>
        <Eyebrow>Our Team</Eyebrow>
        <h2 className="sv-display" style={{ fontSize: 'clamp(2rem,3.4vw,2.75rem)', margin: '18px 0 40px', color: 'var(--ink-900)' }}>
          Operators first, investors second.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          {TEAM.map((m) => (
            <div key={m.name} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar src={m.img} name={m.name} size={132} ring />
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, margin: '18px 0 4px', color: 'var(--ink-900)' }}>{m.name}</h3>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--gold-600)', margin: 0 }}>{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Portfolio ---------- */
const PORTFOLIO = [
  { name: 'Algorized', d: 'Data-centric AI/ML platform for people sensing and positioning using low-cost UWB sensors.' },
  { name: 'Atlas', d: "Agents that handle pricing, packaging, billing and collections for today's AI companies." },
  { name: 'Sindarin', d: 'Fast, reliable voice-AI interfaces with industry-leading latency and turn-taking.' },
  { name: 'Brev.io', d: 'Bridges the gap between your tools, meetings, and business goals — automatically.' },
  { name: 'Cascade', d: 'An AI-powered construction graph to unlock capital flow and bidding efficiency.' },
  { name: 'Runreal', d: 'Tooling dedicated to enhancing the Unreal Engine development experience.' },
];
function Portfolio() {
  return (
    <section id="Portfolio" style={{ background: 'var(--surface-muted)', padding: '88px 0' }}>
      <div style={wrap}>
        <Eyebrow>Our Portfolio</Eyebrow>
        <h2 className="sv-display" style={{ fontSize: 'clamp(2rem,3.4vw,2.75rem)', maxWidth: 760, margin: '18px 0 8px', color: 'var(--ink-900)' }}>
          The next interface shift, backed early.
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: 680, margin: '0 0 36px' }}>
          We believe conversational AI is the greatest advance in user interfaces in 40 years.
          Startups capitalizing today will be tomorrow's market leaders.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {PORTFOLIO.map((c) => (
            <Card key={c.name} interactive padding="md">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gold-300)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink-900)' }}>{c.name[0]}</span>
                <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--ink-900)' }}>{c.name}</h3>
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)', margin: 0 }}>{c.d}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA + footer ---------- */
function CTA({ onSubmit }) {
  return (
    <section style={{ background: 'var(--gold-400)', padding: '76px 0' }}>
      <div style={{ ...wrap, textAlign: 'center' }}>
        <h2 className="sv-display" style={{ fontSize: 'clamp(2rem,3.6vw,3rem)', margin: '0 0 10px', color: 'var(--ink-900)' }}>
          Tell us about your company.
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, color: 'var(--ink-700)', margin: '0 0 28px' }}>
          We co-invest in oversubscribed rounds alongside top lead investors.
        </p>
        <Button variant="dark" size="lg" onClick={onSubmit}>Submit Your Company</Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: 'var(--ink-900)', color: 'rgba(255,255,255,0.7)', padding: '40px 0' }}>
      <div style={{ ...wrap, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <img src="../../assets/logo/lockup-gold-white.png" alt="shuckerVC" style={{ height: 34 }} />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, marginLeft: 'auto' }}>© shuckerVC 2024 · Silicon Valley</span>
      </div>
    </footer>
  );
}

Object.assign(window, { Strategy, ValueAdd, Team, Portfolio, CTA, Footer });
