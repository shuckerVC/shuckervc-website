/* global React */
const { Button, Input } = window.ShuckerVCDesignSystem_35394f;

function SubmitModal({ open, onClose }) {
  if (!open) return null;
  const [sent, setSent] = React.useState(false);
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(17,17,17,0.55)',
      backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 'min(460px, 100%)', background: 'var(--white)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)', padding: 32,
      }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--gold-500)' }}>✓</div>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 20, margin: '8px 0 6px' }}>Thanks — we'll be in touch.</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 22px' }}>
              Our team reviews every submission within a week.
            </p>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <React.Fragment>
            <img src="../../assets/logo/logo-color.png" alt="shuckerVC" style={{ height: 24, marginBottom: 18 }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '0 0 4px', color: 'var(--ink-900)' }}>Submit your company</h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 22px' }}>
              A few details to get the conversation started.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Company name" placeholder="Acme AI" />
              <Input label="Work email" type="email" placeholder="founder@acme.ai" />
              <Input label="Round size" placeholder="$2.5M seed" hint="We co-invest up to $500K" />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Button variant="primary" onClick={() => setSent(true)} style={{ flex: 1 }}>Submit</Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

function App() {
  const [modal, setModal] = React.useState(false);
  const open = () => setModal(true);
  const { Nav, Hero, Strategy, ValueAdd, Team, Portfolio, CTA, Footer } = window;
  return (
    <React.Fragment>
      <Nav onSubmit={open} />
      <Hero onSubmit={open} />
      <Strategy />
      <ValueAdd />
      <Team />
      <Portfolio />
      <CTA onSubmit={open} />
      <Footer />
      <SubmitModal open={modal} onClose={() => setModal(false)} />
    </React.Fragment>
  );
}
window.App = App;
