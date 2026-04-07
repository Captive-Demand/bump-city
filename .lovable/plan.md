

# Fix: Blank Invite Image — Switch to html2canvas

## Root Cause

`html-to-image` (toPng) uses an SVG `foreignObject` technique to capture DOM content. This method is notoriously unreliable with:
- Cross-origin images (even after data URI conversion, the SVG serialization can fail silently)
- CSS features like `object-fit`, `background-size`, Tailwind classes
- Off-screen rendering containers

The result is a valid PNG file that is entirely white/transparent — exactly what the screenshot shows.

## Solution

Replace `html-to-image` with `html2canvas`, which renders directly to a Canvas element by re-implementing the browser's rendering engine in JavaScript. It handles images, CSS, and off-screen elements much more reliably.

### Changes

**1. `package.json`** — swap `html-to-image` for `html2canvas`

**2. `src/components/invites/renderInviteToBlob.ts`** — rewrite to use `html2canvas`:
- Keep the same off-screen container approach
- Keep the data URI pre-conversion for images (belt-and-suspenders)
- Replace `toPng(container)` with `html2canvas(container, { useCORS: true, backgroundColor: '#ffffff', scale: 2 })`
- Convert the resulting canvas to a Blob via `canvas.toBlob()`

```typescript
import html2canvas from "html2canvas";

// After images are loaded and converted to data URIs:
const canvas = await html2canvas(container, {
  useCORS: true,
  backgroundColor: "#ffffff",
  scale: 2,
  width: 500,
  logging: false,
});

return new Promise<Blob>((resolve, reject) => {
  canvas.toBlob(
    (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
    "image/png",
    0.95
  );
});
```

**3. No other files change** — InviteBuilderPage and GuestListPage already call `renderInviteToBlob` correctly.

## Files Modified
- `package.json` — remove `html-to-image`, add `html2canvas`
- `src/components/invites/renderInviteToBlob.ts` — switch capture engine

