/* global React */
const { Button, Stat, Eyebrow } = window.ShuckerVCDesignSystem_35394f;

function Hero({ onSubmit }) {
  return (
    <section id="top" style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface-page)' }}>
      {/* faint mark watermark */}
      <img src="../../assets/logo/mark-gold.png" alt="" aria-hidden="true"
        style={{ position: 'absolute', right: -120, top: -60, width: 620, opacity: 0.10, pointerEvents: 'none' }} />
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '92px 32px 72px', position: 'relative' }}>
        <Eyebrow>Fueling Founder Focus</Eyebrow>
        <h1 className="sv-display" style={{ fontSize: 'clamp(2.5rem, 5.2vw, 4.25rem)', maxWidth: 920, margin: '20px 0 0', color: 'var(--ink-900)' }}>
          Backing top technical founders together with top venture capital firms.
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.05rem,1.6vw,1.25rem)', lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: 660, margin: '24px 0 0' }}>
          shuckerVC invests in B2B software startups alongside leading venture capital firms.
          Based in Silicon Valley, we provide hands-on operational support — so founders focus
          on product and customers.
        </p>
        <div style={{ display: 'flex', gap: 14, marginTop: 34, flexWrap: 'wrap' }}>
          <Button variant="primary" size="lg" onClick={onSubmit}>Submit Your Company</Button>
          <Button variant="secondary" size="lg" as="a" href="#Strategy">Our strategy</Button>
        </div>
        <div style={{ display: 'flex', gap: 56, marginTop: 64, flexWrap: 'wrap' }}>
          <Stat value="$8M" label="Bay Area seed fund" />
          <Stat value="≤ $500K" label="Pre-seed & seed checks" />
          <Stat value="3.08" label="DPI on prior investments" tone="gold" />
        </div>
      </div>
    </section>
  );
}
window.Hero = Hero;
