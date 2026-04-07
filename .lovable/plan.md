

# Comprehensive Invite Styles for the Invite Builder

## Summary
Replace the current simple gradient-based theme system with a rich, visually distinct invite template gallery. Each template will have its own layout, typography treatment, decorative elements, and color palette -- making them feel like real digital invitations rather than color swaps on the same card.

## Current State
The invite builder has 6 "themes" that are just different Tailwind gradient classes applied to the same card layout. Every preview looks structurally identical -- only the background tint changes.

## Approach
Create a template-based system where each invite style is its own React component (or render function) with unique layout, decorative SVG elements, typography hierarchy, and color palette. Users browse a visual picker grid showing thumbnails of each style, tap to select, then customize their text.

## Templates (8 styles)

1. **Blush Elegance** -- Soft pink/rose background, centered serif-style text, thin gold-tone border, delicate corner flourishes (CSS borders/pseudo-elements)
2. **Garden Party** -- Split layout with a floral-patterned left border (SVG/CSS pattern), green + cream palette, playful script-style header
3. **Safari Adventure** -- Warm amber/tan background, animal-print accent stripe, bold uppercase headers, earthy tones
4. **Ocean Dreams** -- Deep teal-to-aqua gradient, wave-shaped SVG divider between header and body, white text overlay
5. **Woodland Whimsy** -- Kraft-paper-tan background, leaf/branch SVG border elements, forest green + cream text
6. **Modern Minimal** -- Clean white card with strong black typography, single accent-color line, lots of whitespace
7. **Boho Sunset** -- Warm terracotta/peach gradient with arch-shaped frame (CSS clip-path or border-radius), earth tones
8. **Starry Night** -- Dark navy/purple background with subtle dot pattern (CSS radial-gradient stars), gold accent text, dreamy feel

## UI Changes

### Template Picker (replaces dropdown)
- A horizontal scrollable grid of template preview cards (small thumbnail renderings of each style)
- Each card shows the template name + a mini visual preview
- Selected template gets a ring/check indicator
- Sits above the text editing fields

### Preview
- Full-size preview renders the selected template component with the user's custom text
- Each template component receives `{ title, eventDate, location, message }` as props

## Files Changed

- `src/pages/InviteBuilderPage.tsx` -- Refactor to use template picker + template renderer
- `src/components/invites/InviteTemplates.tsx` (new) -- All 8 template render functions + thumbnail data (colors, preview layout)
- `src/components/invites/InviteTemplatePicker.tsx` (new) -- Scrollable grid picker component

## Technical Details
- Templates are pure CSS/Tailwind + inline SVG decorations -- no image assets needed
- Each template exports a preview component and a thumbnail config (name, background color, accent color)
- Decorative elements use CSS pseudo-elements, clip-paths, border-radius tricks, and small inline SVGs for flourishes/waves/leaves

