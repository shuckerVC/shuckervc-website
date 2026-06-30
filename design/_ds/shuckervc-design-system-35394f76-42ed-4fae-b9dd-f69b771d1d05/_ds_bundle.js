/* @ds-bundle: {"format":3,"namespace":"ShuckerVCDesignSystem_35394f","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Eyebrow","sourcePath":"components/core/Eyebrow.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Stat","sourcePath":"components/core/Stat.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"84deb332b51d","components/core/Badge.jsx":"5021d0fb0939","components/core/Button.jsx":"5b1edbdf00a3","components/core/Card.jsx":"b3ca67f9901f","components/core/Eyebrow.jsx":"7785c7cfa659","components/core/Input.jsx":"d9befa7f23e6","components/core/Stat.jsx":"8e162ba5f140","ui_kits/website/App.jsx":"9b855efa5c0f","ui_kits/website/Hero.jsx":"9a083429f7bc","ui_kits/website/Nav.jsx":"552d2a166f81","ui_kits/website/Sections.jsx":"4b8b64a8c7ac"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ShuckerVCDesignSystem_35394f = window.ShuckerVCDesignSystem_35394f || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * shuckerVC Avatar — round portrait with optional gold ring; falls back to initials.
 */
function Avatar({
  src,
  name = '',
  size = 56,
  ring = false,
  style = {},
  ...rest
}) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      flex: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gray-100)',
      color: 'var(--ink-700)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      fontSize: size * 0.36,
      boxShadow: ring ? '0 0 0 3px var(--white), 0 0 0 5px var(--gold-400)' : 'none',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement("span", null, initials));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * shuckerVC Badge / pill label — for stage tags, sectors, statuses.
 */
function Badge({
  children,
  variant = 'gold',
  size = 'md',
  ...rest
}) {
  const sizes = {
    sm: {
      fontSize: '0.6875rem',
      padding: '0.2rem 0.55rem'
    },
    md: {
      fontSize: '0.75rem',
      padding: '0.3rem 0.7rem'
    }
  };
  const variants = {
    gold: {
      background: 'var(--gold-300)',
      color: 'var(--ink-900)'
    },
    goldSoft: {
      background: 'var(--gold-100)',
      color: 'var(--gold-600)'
    },
    ink: {
      background: 'var(--ink-900)',
      color: 'var(--white)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--ink-900)',
      boxShadow: 'inset 0 0 0 1.5px var(--border-strong)'
    },
    teal: {
      background: 'rgba(0,180,155,0.14)',
      color: 'var(--teal-600)'
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--weight-semibold)',
      letterSpacing: '0.03em',
      borderRadius: 'var(--radius-pill)',
      lineHeight: 1.2,
      whiteSpace: 'nowrap',
      ...sizes[size],
      ...variants[variant]
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * shuckerVC Button — geometric, confident, gold-forward.
 * Variants: primary (gold), secondary (ink outline), dark (ink fill), ghost.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft = null,
  iconRight = null,
  disabled = false,
  as = 'button',
  ...rest
}) {
  const sizes = {
    sm: {
      fontSize: '0.8125rem',
      padding: '0.5rem 0.875rem',
      gap: '0.4rem'
    },
    md: {
      fontSize: '0.9375rem',
      padding: '0.7rem 1.25rem',
      gap: '0.5rem'
    },
    lg: {
      fontSize: '1.0625rem',
      padding: '0.9rem 1.6rem',
      gap: '0.6rem'
    }
  };
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)',
    lineHeight: 1,
    borderRadius: 'var(--radius-pill)',
    border: '2px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'transform var(--dur-fast) var(--ease-out), background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    ...sizes[size]
  };
  const variants = {
    primary: {
      background: 'var(--brand)',
      color: 'var(--text-on-brand)',
      borderColor: 'var(--brand)'
    },
    dark: {
      background: 'var(--ink-900)',
      color: 'var(--text-inverse)',
      borderColor: 'var(--ink-900)'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--ink-900)',
      borderColor: 'var(--ink-900)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-900)',
      borderColor: 'transparent'
    }
  };
  const onEnter = e => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(-1px)';
    if (variant === 'primary') {
      e.currentTarget.style.background = 'var(--gold-500)';
      e.currentTarget.style.boxShadow = 'var(--shadow-gold)';
    }
    if (variant === 'dark') e.currentTarget.style.background = 'var(--ink-700)';
    if (variant === 'secondary') e.currentTarget.style.background = 'var(--gray-100)';
    if (variant === 'ghost') e.currentTarget.style.background = 'var(--gray-100)';
  };
  const onLeave = e => {
    if (disabled) return;
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.background = variants[variant].background;
  };
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      ...base,
      ...variants[variant]
    },
    disabled: as === 'button' ? disabled : undefined,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave
  }, rest), iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, iconLeft), children, iconRight && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * shuckerVC Card — clean white surface, soft warm shadow, generous radius.
 * `interactive` adds a lift on hover; `tone="ink"` flips to a dark feature card.
 */
function Card({
  children,
  tone = 'light',
  interactive = false,
  padding = 'lg',
  style = {},
  ...rest
}) {
  const pads = {
    none: 0,
    sm: 'var(--space-4)',
    md: 'var(--space-5)',
    lg: 'var(--space-6)'
  };
  const tones = {
    light: {
      background: 'var(--surface-card)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)'
    },
    muted: {
      background: 'var(--surface-muted)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)'
    },
    ink: {
      background: 'var(--ink-900)',
      color: 'var(--text-inverse)',
      border: '1px solid var(--ink-900)'
    }
  };
  const onEnter = e => {
    if (!interactive) return;
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
  };
  const onLeave = e => {
    if (!interactive) return;
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    style: {
      borderRadius: 'var(--radius-lg)',
      padding: pads[padding],
      boxShadow: 'var(--shadow-sm)',
      transition: 'transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
      ...tones[tone],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * shuckerVC Eyebrow — uppercase, gold, wide-tracked section label.
 * Often sits above an Alice display heading.
 */
function Eyebrow({
  children,
  color = 'gold',
  style = {},
  ...rest
}) {
  const colors = {
    gold: 'var(--gold-600)',
    ink: 'var(--ink-900)',
    muted: 'var(--text-secondary)',
    inverse: 'var(--gold-400)'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontFamily: 'var(--font-sans)',
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: 'var(--tracking-caps)',
      textTransform: 'uppercase',
      color: colors[color],
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 2,
      background: 'currentColor',
      borderRadius: 2
    }
  }), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * shuckerVC Input — clean field with warm hairline border and gold focus ring.
 */
function Input({
  label,
  hint,
  type = 'text',
  invalid = false,
  id,
  style = {},
  ...rest
}) {
  const fieldId = id || (label ? 'in-' + label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontSize: '0.8125rem',
      fontWeight: 600,
      color: 'var(--text-primary)'
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: type,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: '0.9375rem',
      color: 'var(--text-primary)',
      background: 'var(--white)',
      padding: '0.65rem 0.85rem',
      borderRadius: 'var(--radius-md)',
      border: '1.5px solid ' + (invalid ? 'var(--danger)' : focus ? 'var(--gold-500)' : 'var(--border-strong)'),
      boxShadow: focus ? '0 0 0 3px rgba(255,192,9,0.18)' : 'none',
      outline: 'none',
      transition: 'border-color var(--dur-base), box-shadow var(--dur-base)'
    }
  }, rest)), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      color: invalid ? 'var(--danger)' : 'var(--text-secondary)'
    }
  }, hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/Stat.jsx
try { (() => {
/**
 * shuckerVC Stat — a big Alice number with a sans label, for metrics
 * like "$8M fund", "3.08 DPI", "$500K checks".
 */
function Stat({
  value,
  label,
  tone = 'ink',
  align = 'left'
}) {
  const valueColor = tone === 'gold' ? 'var(--gold-600)' : tone === 'inverse' ? 'var(--gold-400)' : 'var(--ink-900)';
  const labelColor = tone === 'inverse' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem',
      textAlign: align,
      alignItems: align === 'center' ? 'center' : 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(2.25rem, 4vw, 3.25rem)',
      lineHeight: 1,
      letterSpacing: '-0.02em',
      color: valueColor
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.02em',
      color: labelColor
    }
  }, label));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Stat.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/App.jsx
try { (() => {
/* global React */
const {
  Button,
  Input
} = window.ShuckerVCDesignSystem_35394f;
function SubmitModal({
  open,
  onClose
}) {
  if (!open) return null;
  const [sent, setSent] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(17,17,17,0.55)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: 'min(460px, 100%)',
      background: 'var(--white)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-lg)',
      padding: 32
    }
  }, sent ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '20px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 40,
      color: 'var(--gold-500)'
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 20,
      margin: '8px 0 6px'
    }
  }, "Thanks \u2014 we'll be in touch."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--text-secondary)',
      margin: '0 0 22px'
    }
  }, "Our team reviews every submission within a week."), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: onClose
  }, "Close")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/logo-color.png",
    alt: "shuckerVC",
    style: {
      height: 24,
      marginBottom: 18
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 26,
      margin: '0 0 4px',
      color: 'var(--ink-900)'
    }
  }, "Submit your company"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--text-secondary)',
      margin: '0 0 22px'
    }
  }, "A few details to get the conversation started."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Company name",
    placeholder: "Acme AI"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Work email",
    type: "email",
    placeholder: "founder@acme.ai"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Round size",
    placeholder: "$2.5M seed",
    hint: "We co-invest up to $500K"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: () => setSent(true),
    style: {
      flex: 1
    }
  }, "Submit"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onClose
  }, "Cancel")))));
}
function App() {
  const [modal, setModal] = React.useState(false);
  const open = () => setModal(true);
  const {
    Nav,
    Hero,
    Strategy,
    ValueAdd,
    Team,
    Portfolio,
    CTA,
    Footer
  } = window;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Nav, {
    onSubmit: open
  }), /*#__PURE__*/React.createElement(Hero, {
    onSubmit: open
  }), /*#__PURE__*/React.createElement(Strategy, null), /*#__PURE__*/React.createElement(ValueAdd, null), /*#__PURE__*/React.createElement(Team, null), /*#__PURE__*/React.createElement(Portfolio, null), /*#__PURE__*/React.createElement(CTA, {
    onSubmit: open
  }), /*#__PURE__*/React.createElement(Footer, null), /*#__PURE__*/React.createElement(SubmitModal, {
    open: modal,
    onClose: () => setModal(false)
  }));
}
window.App = App;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Hero.jsx
try { (() => {
/* global React */
const {
  Button,
  Stat,
  Eyebrow
} = window.ShuckerVCDesignSystem_35394f;
function Hero({
  onSubmit
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: "top",
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/mark-gold.png",
    alt: "",
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      right: -120,
      top: -60,
      width: 620,
      opacity: 0.10,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '92px 32px 72px',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Fueling Founder Focus"), /*#__PURE__*/React.createElement("h1", {
    className: "sv-display",
    style: {
      fontSize: 'clamp(2.5rem, 5.2vw, 4.25rem)',
      maxWidth: 920,
      margin: '20px 0 0',
      color: 'var(--ink-900)'
    }
  }, "Backing top technical founders together with top venture capital firms."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'clamp(1.05rem,1.6vw,1.25rem)',
      lineHeight: 1.6,
      color: 'var(--text-secondary)',
      maxWidth: 660,
      margin: '24px 0 0'
    }
  }, "shuckerVC invests in B2B software startups alongside leading venture capital firms. Based in Silicon Valley, we provide hands-on operational support \u2014 so founders focus on product and customers."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 34,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onSubmit
  }, "Submit Your Company"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    as: "a",
    href: "#Strategy"
  }, "Our strategy")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 56,
      marginTop: 64,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    value: "$8M",
    label: "Bay Area seed fund"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: "\u2264 $500K",
    label: "Pre-seed & seed checks"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: "3.08",
    label: "DPI on prior investments",
    tone: "gold"
  }))));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Nav.jsx
try { (() => {
/* global React */
const {
  Button
} = window.ShuckerVCDesignSystem_35394f;
function Nav({
  onSubmit
}) {
  const links = ['Strategy', 'Real Value Added', 'Team', 'Portfolio'];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(255,255,255,0.86)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-max)',
      margin: '0 auto',
      padding: '0 32px',
      height: 76,
      display: 'flex',
      alignItems: 'center',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#top",
    style: {
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/logo-color.png",
    alt: "shuckerVC",
    style: {
      height: 30
    }
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 28,
      marginLeft: 12
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: '#' + l.replace(/\s+/g, ''),
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--ink-700)'
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    onClick: onSubmit
  }, "Submit Your Company"))));
}
window.Nav = Nav;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Nav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Sections.jsx
try { (() => {
/* global React */
const {
  Card,
  Eyebrow,
  Badge,
  Avatar,
  Button
} = window.ShuckerVCDesignSystem_35394f;
const wrap = {
  maxWidth: 'var(--container-max)',
  margin: '0 auto',
  padding: '0 32px'
};

/* ---------- Strategy (dark feature band) ---------- */
function Strategy() {
  return /*#__PURE__*/React.createElement("section", {
    id: "Strategy",
    style: {
      background: 'var(--ink-900)',
      color: '#fff',
      padding: '88px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: wrap
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "inverse"
  }, "Our Strategy"), /*#__PURE__*/React.createElement("h2", {
    className: "sv-display",
    style: {
      fontSize: 'clamp(2rem,3.6vw,3rem)',
      maxWidth: 880,
      margin: '18px 0 0'
    }
  }, "We believe that focused founders build the strongest companies."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: '1.1rem',
      lineHeight: 1.7,
      color: 'rgba(255,255,255,0.74)',
      maxWidth: 760,
      margin: '24px 0 0'
    }
  }, "shuckerVC invests in early-stage, U.S.-based B2B software companies. We are industry and technology agnostic and prefer technical founders targeting markets ripe for digital transformation. Our unique support model secures our place in oversubscribed funding rounds alongside top lead investors."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 28,
      flexWrap: 'wrap'
    }
  }, ['Pre-seed', 'Seed', 'B2B Software', 'AI-native', 'Co-invest'].map(t => /*#__PURE__*/React.createElement(Badge, {
    key: t,
    variant: "teal"
  }, t)))));
}

/* ---------- Real Value Added (3 numbered cards) ---------- */
function ValueAdd() {
  const items = [{
    n: '1',
    t: 'Time to Market',
    d: 'Bringing a product to market quickly is crucial, but founders often have to handle bookkeeping, hiring, and even cleaning.'
  }, {
    n: '2',
    t: 'Founders Focus',
    d: 'shuckerVC founders save thousands of hours by delegating back-office duties to their dedicated Support Partner.'
  }, {
    n: '3',
    t: 'Integrated Operations',
    d: 'Along with a full-time Support Partner, we provide playbooks, software, and access to expert professionals.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "RealValueAdded",
    style: {
      background: 'var(--surface-muted)',
      padding: '88px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: wrap
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Real Value Added"), /*#__PURE__*/React.createElement("h2", {
    className: "sv-display",
    style: {
      fontSize: 'clamp(2rem,3.4vw,2.75rem)',
      maxWidth: 720,
      margin: '18px 0 8px',
      color: 'var(--ink-900)'
    }
  }, "Founders focus on product & customer, shuckerVC does the rest."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 20,
      marginTop: 40
    }
  }, items.map(it => /*#__PURE__*/React.createElement(Card, {
    key: it.n,
    interactive: true
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 44,
      lineHeight: 1,
      color: 'var(--gold-500)'
    }
  }, it.n), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 20,
      fontWeight: 600,
      margin: '14px 0 8px',
      color: 'var(--ink-900)'
    }
  }, it.t), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, it.d))))));
}

/* ---------- Team ---------- */
const TEAM = [{
  name: "Jean-Philippe 'JP' Persico",
  role: 'Managing Partner',
  img: '../../assets/team/jp-persico.jpg'
}, {
  name: 'Graham Siegel',
  role: 'Managing Partner',
  img: '../../assets/team/graham-siegel.jpeg'
}, {
  name: 'Gabe Regalado',
  role: 'Venture Partner',
  img: null
}, {
  name: 'Megan Liu',
  role: 'Support Partner',
  img: null
}];
function Team() {
  return /*#__PURE__*/React.createElement("section", {
    id: "OurTeam",
    style: {
      background: 'var(--surface-page)',
      padding: '88px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: wrap
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Our Team"), /*#__PURE__*/React.createElement("h2", {
    className: "sv-display",
    style: {
      fontSize: 'clamp(2rem,3.4vw,2.75rem)',
      margin: '18px 0 40px',
      color: 'var(--ink-900)'
    }
  }, "Operators first, investors second."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 24
    }
  }, TEAM.map(m => /*#__PURE__*/React.createElement("div", {
    key: m.name,
    style: {
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    src: m.img,
    name: m.name,
    size: 132,
    ring: true
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 16,
      fontWeight: 600,
      margin: '18px 0 4px',
      color: 'var(--ink-900)'
    }
  }, m.name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--gold-600)',
      margin: 0
    }
  }, m.role))))));
}

/* ---------- Portfolio ---------- */
const PORTFOLIO = [{
  name: 'Algorized',
  d: 'Data-centric AI/ML platform for people sensing and positioning using low-cost UWB sensors.'
}, {
  name: 'Atlas',
  d: "Agents that handle pricing, packaging, billing and collections for today's AI companies."
}, {
  name: 'Sindarin',
  d: 'Fast, reliable voice-AI interfaces with industry-leading latency and turn-taking.'
}, {
  name: 'Brev.io',
  d: 'Bridges the gap between your tools, meetings, and business goals — automatically.'
}, {
  name: 'Cascade',
  d: 'An AI-powered construction graph to unlock capital flow and bidding efficiency.'
}, {
  name: 'Runreal',
  d: 'Tooling dedicated to enhancing the Unreal Engine development experience.'
}];
function Portfolio() {
  return /*#__PURE__*/React.createElement("section", {
    id: "Portfolio",
    style: {
      background: 'var(--surface-muted)',
      padding: '88px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: wrap
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Our Portfolio"), /*#__PURE__*/React.createElement("h2", {
    className: "sv-display",
    style: {
      fontSize: 'clamp(2rem,3.4vw,2.75rem)',
      maxWidth: 760,
      margin: '18px 0 8px',
      color: 'var(--ink-900)'
    }
  }, "The next interface shift, backed early."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 16,
      lineHeight: 1.6,
      color: 'var(--text-secondary)',
      maxWidth: 680,
      margin: '0 0 36px'
    }
  }, "We believe conversational AI is the greatest advance in user interfaces in 40 years. Startups capitalizing today will be tomorrow's market leaders."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 18
    }
  }, PORTFOLIO.map(c => /*#__PURE__*/React.createElement(Card, {
    key: c.name,
    interactive: true,
    padding: "md"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: 'var(--gold-300)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: 18,
      color: 'var(--ink-900)'
    }
  }, c.name[0]), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 18,
      fontWeight: 600,
      margin: 0,
      color: 'var(--ink-900)'
    }
  }, c.name)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      lineHeight: 1.55,
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, c.d))))));
}

/* ---------- CTA + footer ---------- */
function CTA({
  onSubmit
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--gold-400)',
      padding: '76px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...wrap,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    className: "sv-display",
    style: {
      fontSize: 'clamp(2rem,3.6vw,3rem)',
      margin: '0 0 10px',
      color: 'var(--ink-900)'
    }
  }, "Tell us about your company."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 17,
      color: 'var(--ink-700)',
      margin: '0 0 28px'
    }
  }, "We co-invest in oversubscribed rounds alongside top lead investors."), /*#__PURE__*/React.createElement(Button, {
    variant: "dark",
    size: "lg",
    onClick: onSubmit
  }, "Submit Your Company")));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--ink-900)',
      color: 'rgba(255,255,255,0.7)',
      padding: '40px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...wrap,
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo/lockup-gold-white.png",
    alt: "shuckerVC",
    style: {
      height: 34
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      marginLeft: 'auto'
    }
  }, "\xA9 shuckerVC 2024 \xB7 Silicon Valley")));
}
Object.assign(window, {
  Strategy,
  ValueAdd,
  Team,
  Portfolio,
  CTA,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Sections.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Stat = __ds_scope.Stat;

})();
