# Sistema de design — Boi Forte
Gerado com **UI/UX Pro Max** (curadoria de estilo + paleta + tipografia).
- **Estilo:** Neumorphism
- **Palavras-chave:** Soft UI, embossed, debossed, convex, concave, light source, subtle depth, rounded (12-16px), monochromatic
- **Modo:** light
- **Fontes:** Atkinson Hyperlegible (títulos) / Atkinson Hyperlegible (corpo)
- **Efeitos:** Soft box-shadow (multiple: -5px -5px 15px, 5px 5px 15px), smooth press (150ms), inner subtle shadow
- **Padrão de landing:** Hero + Testimonials + CTA — Hero > Problem statement > Solution overview > Testimonials carousel > CTA
- **Evitar:** Bright neon + Motion overload
## Tokens (CSS vars em `app/globals.css`)
```css
--bg: 270 100% 98%;
--surface: 0 0% 100%;
--surface-2: 230 50% 95%;
--border: 251 91% 95%;
--fg: 264 67% 35%;
--fg-muted: 215 19% 35%;
--brand: 258 90% 66%;
--brand-fg: 0 0% 0%;
--accent: 161 94% 30%;
--accent-fg: 0 0% 0%;
```
_Use SEMPRE os tokens (`bg-brand`, `text-fg`, `border-border`…), nunca hex cru._