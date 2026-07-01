**Button** — the pill-shaped CTA in the shuckerVC voice; use `primary` (gold) for the single most important action on a view, `dark` / `secondary` / `ghost` for descending emphasis.

```jsx
<Button variant="primary" size="lg">Submit Your Company</Button>
<Button variant="secondary">Learn more</Button>
<Button variant="dark" iconRight={<Arrow/>}>Our strategy</Button>
```

Variants: `primary` (gold fill, ink text, gold-glow on hover) · `dark` (ink fill) · `secondary` (ink outline) · `ghost` (text only). Sizes: `sm` · `md` · `lg`. Supports `iconLeft` / `iconRight`, `disabled`, and `as="a"` for links.
