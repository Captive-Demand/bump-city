import { templates } from "@/components/invites/InviteTemplates";
import html2canvas from "html2canvas";
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
 * Renders an invite template off-screen to a PNG Blob using html2canvas.
 */
export async function renderInviteToBlob(opts: RenderOptions): Promise<Blob> {
  const TemplateComponent = templates[opts.templateId] || templates["baby-blocks"];

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:500px;z-index:-1;background:#ffffff;";
  document.body.appendChild(container);

  const { createRoot } = await import("react-dom/client");
  const root = createRoot(container);

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

  await new Promise<void>((resolve) => {
    root.render(
      createElement(TemplateComponent, {
        title: opts.title,
        eventDate: opts.eventDate,
        location: opts.location,
        message: opts.message,
        timeRange: opts.timeRange,
      })
    );
    setTimeout(async () => {
      const imgs = container.querySelectorAll("img");
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
      setTimeout(resolve, 500);
    }, 300);
  });

  try {
    const canvas = await html2canvas(container, {
      useCORS: true,
      backgroundColor: "#ffffff",
      scale: 2,
      width: 500,
      logging: false,
    });

    root.unmount();
    document.body.removeChild(container);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        "image/png",
        0.95
      );
    });
  } catch (err) {
    root.unmount();
    document.body.removeChild(container);
    throw err;
  }
}
