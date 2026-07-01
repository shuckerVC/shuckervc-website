/* global React */
const { Button } = window.ShuckerVCDesignSystem_35394f;

function Nav({ onSubmit }) {
  const links = ['Strategy', 'Real Value Added', 'Team', 'Portfolio'];
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 'var(--container-max)', margin: '0 auto', padding: '0 32px',
        height: 76, display: 'flex', alignItems: 'center', gap: 32,
      }}>
        <a href="#top" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="../../assets/logo/logo-color.png" alt="shuckerVC" style={{ height: 30 }} />
        </a>
        <nav style={{ display: 'flex', gap: 28, marginLeft: 12 }}>
          {links.map((l) => (
            <a key={l} href={'#' + l.replace(/\s+/g, '')}
              style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--ink-700)' }}>
              {l}
            </a>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto' }}>
          <Button variant="primary" size="sm" onClick={onSubmit}>Submit Your Company</Button>
        </div>
      </div>
    </header>
  );
}
window.Nav = Nav;
