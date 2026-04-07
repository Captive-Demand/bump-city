

# Fix: Blank Invite Image in Emails

## Root Cause

The invite templates use Vite-bundled image imports (e.g., `import babyBlocksBg from "@/assets/invites/baby-blocks.png"`). When `html-to-image` tries to capture the off-screen container, it fails to render these images because:
1. The bundled image URLs may trigger CORS/tainted-canvas issues
2. Even with the image-load wait logic, `toPng` silently produces a blank/transparent PNG

The screenshot confirms this — the uploaded image is just a transparent checkerboard.

## Solution

Before calling `toPng`, convert all `<img>` elements inside the off-screen container from URL sources to inline **base64 data URIs**. This guarantees `html-to-image` can read every pixel without CORS issues.

### Changes

**`src/pages/GuestListPage.tsx`** — update `renderInviteToImage`:

1. After React renders the template and images load, loop through all `<img>` elements in the container
2. For each image, fetch the `src` URL, read it as a blob, convert to a base64 data URI using `FileReader`, and replace the `img.src` with the data URI
3. Then call `toPng` — all image data is now inline and guaranteed capturable

```typescript
// Helper: convert image URL to base64 data URI
const urlToDataUri = async (url: string): Promise<string> => {
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// After images load, replace all img.src with data URIs
const imgs = container.querySelectorAll("img");
await Promise.all(
  Array.from(imgs).map(async (img) => {
    if (img.src && !img.src.startsWith("data:")) {
      img.src = await urlToDataUri(img.src);
    }
  })
);
```

This is the only file that needs to change. The email template and storage upload logic remain the same.

## Files Modified
- `src/pages/GuestListPage.tsx` — replace image URLs with data URIs before PNG capture

