

# Use Uploaded Backgrounds for Premium Invite Templates

## Summary
Replace the current 8 CSS/SVG-based templates with 6 image-backed templates using your uploaded background images. Each template becomes a full-bleed background image with elegantly positioned text overlaid in the open space, using fonts that match each design's aesthetic.

## Background-to-Template Mapping

| # | Image | Style Name | Text Position | Font Style |
|---|-------|-----------|---------------|------------|
| 1 | `1_copy_2.png` | Baby Blocks | Center (upper-mid area, between bunting and bottom art) | Rounded, playful serif |
| 2 | `2_copy_2.png` | Floral Wreath | Center (inside the wreath opening) | Elegant script + light serif |
| 3 | `3_copy_2.png` | Blush Roses | Center (large open white area) | Romantic serif, soft rose tones |
| 4 | `4_copy_2.png` | Garden Peony | Center (between top and bottom borders) | Classic serif, sage green text |
| 5 | `5_copy_2.png` | Sage Leaf | Center-right (leaves are on the left) | Modern minimal serif, muted green |
| 6 | `6_copy_2.png` | Vintage Tulip | Upper area (flowers are at bottom) | Warm serif, deep burgundy text |

## Approach

### 1. Copy images into `src/assets/invites/`
All 6 uploaded PNGs get copied into the project as static assets.

### 2. Rewrite `InviteTemplates.tsx`
- Reduce from 8 templates to 6 (matching the 6 backgrounds)
- Each template: full-size `<img>` background with `object-cover`, then absolutely positioned text container in the open space
- Text uses Google Fonts loaded via `index.html` link tags -- likely **Playfair Display** (elegant serif) and **Cormorant Garamond** (refined body) to match the watercolor/botanical aesthetic
- Text color and positioning tuned per template to sit naturally in each image's open area

### 3. Update `templateConfigs` array
Trim to 6 entries with updated names matching the new designs.

### 4. Add Google Font links to `index.html`
Two `<link>` tags for Playfair Display and Cormorant Garamond.

## Template Component Pattern
```text
┌──────────────────────┐
│  <img> background    │
│  (absolute, cover)   │
│                      │
│   ┌──────────────┐   │
│   │  TITLE       │   │  ← absolutely positioned
│   │  date        │   │     in the open area
│   │  location    │   │
│   │  message     │   │
│   └──────────────┘   │
│                      │
└──────────────────────┘
```

## Files Changed
- `index.html` -- add Google Font links
- `src/assets/invites/` -- 6 new image files (copied from uploads)
- `src/components/invites/InviteTemplates.tsx` -- full rewrite: 6 image-backed templates
- `src/components/invites/InviteTemplatePicker.tsx` -- no structural change needed (already renders live previews)

