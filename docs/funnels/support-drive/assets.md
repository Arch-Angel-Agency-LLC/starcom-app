# Support Drive Assets

1. Purpose
- Define visual direction, tokens, and asset requirements for the funnel.

2. Visual direction
- Theme: heroic resistance, decentralized; dark base with neon/steel accent.
- Mood: urgent, confident, anti-capture; no pity.

3. Color guidance (holographic blue/cyan/turquoise theme)
- Base background: #04101A (anchor for contrast)
- Surface: #0A1A29 (glass layer backdrop)
- Primary accent: #35C7FF (vivid cyan for primary CTAs)
- Secondary accent: #1290D1 (cool blue for secondary CTAs)
- Turquoise accent: #1FD1C2 (use sparingly for emphasis/edges)
- Text primary: #E9F8FF (body/heading on dark)
- Text secondary: #A6B3C5 (meta text)
- Success/confirm: #57F2C4 (mint that still reads against the dark base)
- Warn: #F4B74A (amber line for notices without clashing)
- Danger (hover/critical): #F47C7C (desaturated red, limited use)
- Near-white highlight: #F8FDFF (for glints/lines, not body)
- Notes:
	- Reserve the brightest accents (#35C7FF) for primaries and focus rings.
	- Avoid cyan-on-teal text; keep text on dark or near-white on accent fills.
	- Ensure AA contrast on buttons: #04101A text over #35C7FF, or #E9F8FF over #1290D1.

4. Typography (Aldrich primary)
- Heading font: Aldrich for headings/CTAs; uppercase with +4–6% letter spacing.
- Body font: If constrained to Aldrich, raise size/line-height for legibility; otherwise pair with a humanist sans for body copy while keeping Aldrich for headings.
- Button text: Aldrich, uppercase allowed; ensure 44px targets and maintain contrast.

5. Iconography
- Close icon (simple x), external link icon for CTAs, copy icon for invite.
- Use existing icon set if present in app; avoid adding heavy libraries.

6. Imagery
- Optional background grain/gradient; avoid heavy images to keep perf.
- If hero art used, keep under 100KB and provide 2x for retina; lazy-load if needed.

7. Animation specs
- Entry: fade/slide up 150-200ms; easing ease-out.
- CTA emphasis: subtle glow/pulse 1.5-2s loop; disable on reduced-motion.
- Copy toast: fade in/out 200ms.

8. Layout sizing
- Modal max-width desktop: ~520-640px.
- Mobile: full width minus safe padding; min 16px padding.
- CTA height: min 44px touch target.

9. Asset delivery
- Prefer SVG for icons; CSS gradients for backgrounds; avoid extra font weights beyond what is used.
- Serve fonts with swap; define fallbacks.

10. Light/dark handling
- Primary design assumes dark surface. If light theme needed, invert colors with maintained contrast; document alternative palette.

11. Accessibility in visuals
- Maintain contrast ratios; check button text against backgrounds.
- Avoid rapid animations or flashing; respect reduced-motion.

12. Don’ts
- No busy parallax backgrounds; no long-running animations; no heavy video.
- Avoid purple bias unless brand requires; stay on neon/steel theme.

13. Asset checklist
- Logo (SVG/PNG) if required on modal.
- Icons: close, external link, copy, info.
- Background treatment: gradient CSS snippet.
- Font files or approved CDN links.

14. Implementation tips
- Keep styles modular; avoid global overrides.
- Use CSS variables to map tokens so experiments can adjust accent emphasis easily.

15. Changelog
- Document token changes, new assets, or animation tweaks when updated.
