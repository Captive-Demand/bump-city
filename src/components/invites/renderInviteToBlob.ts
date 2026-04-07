import { templates } from "@/components/invites/InviteTemplates";
import { toPng } from "html-to-image";
import { createElement } from "react";

interface RenderOptions {
  templateId: string;
  title: string;
  eventDate?: Date;
  location: string;
  message: string;
  timeRange?: string;
}

/**
 * Renders an invite template off-screen to a PNG Blob.
 * Converts all <img> sources to data URIs first to avoid CORS issues.
 */
export async function renderInviteToBlob(opts: RenderOptions): Promise<Blob> {
  const TemplateComponent = templates[opts.templateId] || templates["baby-blocks"];

  // Create off-screen container with explicit dimensions
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:500px;z-index:-1;background:#ffffff;";
  document.body.appendChild(container);

  const { createRoot } = await import("react-dom/client");
  const root = createRoot(container);

  // Helper: fetch URL → base64 data URI
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

  // Render template
  await new Promise<void>((resolve) => {
    root.render(
      createElement(TemplateComponent, {
        title: opts.title,
        eventDate: opts.eventDate,
        location: opts.location,
        message: opts.message,
      })
    );
    // Wait for render + image load + data URI swap
    setTimeout(async () => {
      const imgs = container.querySelectorAll("img");
      // Wait for images to load
      await Promise.all(
        Array.from(imgs).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((res) => {
                img.onload = () => res();
                img.onerror = () => res();
              })
        )
      );
      // Convert to inline data URIs
      await Promise.all(
        Array.from(imgs).map(async (img) => {
          if (img.src && !img.src.startsWith("data:")) {
            try {
              img.src = await urlToDataUri(img.src);
            } catch (e) {
              console.warn("Failed to convert image to data URI:", e);
            }
          }
        })
      );
      // Extra buffer for fonts
      setTimeout(resolve, 500);
    }, 300);
  });

  try {
    const dataUrl = await toPng(container, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    root.unmount();
    document.body.removeChild(container);

    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (err) {
    root.unmount();
    document.body.removeChild(container);
    throw err;
  }
}
