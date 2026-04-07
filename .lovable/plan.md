

# Elevate Invite Templates to Premium Quality

## Problem
The current templates look flat and generic. Thumbnails are just colored rectangles with tiny lines. The full templates use basic emoji (🦒🐘🌿), small SVG flourishes, simple `text-sm` typography, and generic `rounded-full` buttons. Nothing feels "premium invitation."

## Approach
Redesign all 8 templates and the picker to feel like high-end digital stationery. The key upgrades:

### Typography Hierarchy
- Larger, more dramatic titles (text-3xl to text-4xl) with generous letter-spacing
- Use font-family overrides: `Playfair Display` feel via Georgia/serif with italic + light weight combos
- More vertical whitespace between elements (py-16 instead of py-10)
- Refined sub-labels with ultra-wide tracking (0.4em+)

### Decorative Elements (replace emoji with SVG art)
- **Blush Elegance**: Elaborate gold corner ornaments with multi-curve flourishes, double-line inner border
- **Garden Party**: Full botanical SVG border with leaves, stems, and flower clusters along left and top edges
- **Safari Adventure**: Replace emoji animals with elegant SVG silhouettes (giraffe, elephant, leaf branch), textured linen-style background pattern
- **Ocean Dreams**: Layered multi-wave SVG divider with 3 wave layers at different opacities, subtle bubble dots
- **Woodland Whimsy**: Detailed branch + leaf SVG frame around all four edges, mushroom/acorn accents
- **Modern Minimal**: Dramatic oversized serif title, geometric line accents, asymmetric layout
- **Boho Sunset**: Layered arch frames (double arch), dried-flower SVG motifs, warm texture overlay
- **Starry Night**: Crescent moon SVG, constellation line patterns, more stars with varied sizes, shimmer effect

### Button Upgrades
- Elegant pill buttons with subtle box-shadow and hover states
- Template-appropriate styling (e.g., gold outlined for Blush, frosted glass for Ocean Dreams)

### Thumbnail Picker Upgrade
- Render a **mini version of the actual template** inside each thumbnail instead of abstract colored lines
- Show the template's signature decorative element in miniature
- Each thumbnail gets a subtle inner shadow for depth
- Slightly larger thumbnails with better aspect ratio

### Color Refinements
- More sophisticated palettes with 3-4 tones per template instead of 2
- Subtle background textures via CSS patterns (linen, paper grain, etc.)
- Better contrast ratios for readability

## Files Changed
- `src/components/invites/InviteTemplates.tsx` -- Complete rewrite of all 8 template components with premium SVG art, refined typography, and luxe color palettes
- `src/components/invites/InviteTemplatePicker.tsx` -- Upgraded thumbnails that show miniature template previews with signature decorative elements

