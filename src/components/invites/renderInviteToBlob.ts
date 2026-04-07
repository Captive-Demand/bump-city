import { format } from "date-fns";
import babyBlocksBg from "@/assets/invites/baby-blocks.png";
import floralWreathBg from "@/assets/invites/floral-wreath.png";
import blushRosesBg from "@/assets/invites/blush-roses.png";
import gardenPeonyBg from "@/assets/invites/garden-peony.png";
import sageLeafBg from "@/assets/invites/sage-leaf.png";

interface RenderOptions {
  templateId: string;
  title: string;
  eventDate?: Date;
  location: string;
  message: string;
  timeRange?: string;
}

type TemplateStyle = {
  backgroundSrc: string;
  introText: string;
  introColor: string;
  titleColor: string;
  dividerColor: string;
  detailColor: string;
  messageColor: string;
  contentX: number;
  contentTop: number;
  contentWidth: number;
  messageWidth: number;
  align: CanvasTextAlign;
  titleFont: string;
  detailFont: string;
  messageFont: string;
  titleLineHeight: number;
  detailLineHeight: number;
  messageLineHeight: number;
  dividerWidth: number;
  tracking: number;
};

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1400;

const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  "baby-blocks": {
    backgroundSrc: babyBlocksBg,
    introText: "YOU'RE INVITED TO",
    introColor: "#7a9bb5",
    titleColor: "#5a7a92",
    dividerColor: "#d4a0b0",
    detailColor: "#7a9bb5",
    messageColor: "#9ab0bf",
    contentX: 500,
    contentTop: 325,
    contentWidth: 620,
    messageWidth: 520,
    align: "center",
    titleFont: '600 84px Georgia, "Times New Roman", serif',
    detailFont: '400 42px Georgia, "Times New Roman", serif',
    messageFont: 'italic 34px Georgia, "Times New Roman", serif',
    titleLineHeight: 92,
    detailLineHeight: 52,
    messageLineHeight: 44,
    dividerWidth: 120,
    tracking: 5,
  },
  "floral-wreath": {
    backgroundSrc: floralWreathBg,
    introText: "PLEASE JOIN US FOR",
    introColor: "#b07850",
    titleColor: "#5a6e50",
    dividerColor: "#c9a87a",
    detailColor: "#6e8560",
    messageColor: "#8a7a60",
    contentX: 500,
    contentTop: 300,
    contentWidth: 640,
    messageWidth: 540,
    align: "center",
    titleFont: '600 82px Georgia, "Times New Roman", serif',
    detailFont: '400 40px Georgia, "Times New Roman", serif',
    messageFont: 'italic 34px Georgia, "Times New Roman", serif',
    titleLineHeight: 90,
    detailLineHeight: 50,
    messageLineHeight: 44,
    dividerWidth: 112,
    tracking: 4,
  },
  "blush-roses": {
    backgroundSrc: blushRosesBg,
    introText: "YOU'RE INVITED",
    introColor: "#c4917e",
    titleColor: "#8b6b60",
    dividerColor: "#d4a898",
    detailColor: "#a08070",
    messageColor: "#b09888",
    contentX: 500,
    contentTop: 390,
    contentWidth: 660,
    messageWidth: 560,
    align: "center",
    titleFont: '600 82px Georgia, "Times New Roman", serif',
    detailFont: '400 40px Georgia, "Times New Roman", serif',
    messageFont: 'italic 34px Georgia, "Times New Roman", serif',
    titleLineHeight: 90,
    detailLineHeight: 50,
    messageLineHeight: 44,
    dividerWidth: 120,
    tracking: 5,
  },
  "garden-peony": {
    backgroundSrc: gardenPeonyBg,
    introText: "TOGETHER WITH OUR FAMILIES",
    introColor: "#6b7f60",
    titleColor: "#4a5e40",
    dividerColor: "#8a9e7a",
    detailColor: "#5a6e50",
    messageColor: "#7a8e6a",
    contentX: 500,
    contentTop: 305,
    contentWidth: 650,
    messageWidth: 540,
    align: "center",
    titleFont: '600 82px Georgia, "Times New Roman", serif',
    detailFont: '400 40px Georgia, "Times New Roman", serif',
    messageFont: 'italic 34px Georgia, "Times New Roman", serif',
    titleLineHeight: 90,
    detailLineHeight: 50,
    messageLineHeight: 44,
    dividerWidth: 112,
    tracking: 4,
  },
  "sage-leaf": {
    backgroundSrc: sageLeafBg,
    introText: "YOU'RE INVITED",
    introColor: "#7a8e78",
    titleColor: "#4a5e48",
    dividerColor: "#8aa088",
    detailColor: "#5a6e58",
    messageColor: "#7a8e78",
    contentX: 650,
    contentTop: 235,
    contentWidth: 380,
    messageWidth: 350,
    align: "center",
    titleFont: '600 74px Georgia, "Times New Roman", serif',
    detailFont: '400 38px Georgia, "Times New Roman", serif',
    messageFont: 'italic 32px Georgia, "Times New Roman", serif',
    titleLineHeight: 82,
    detailLineHeight: 46,
    messageLineHeight: 40,
    dividerWidth: 104,
    tracking: 5,
  },
};

function getLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text
    .split("\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return [];

  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    let currentLine = words[0];

    for (let i = 1; i < words.length; i += 1) {
      const testLine = `${currentLine} ${words[i]}`;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }

    lines.push(currentLine);
  }

  return lines;
}

function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  align: CanvasTextAlign
) {
  const characters = Array.from(text);
  const totalWidth = characters.reduce((sum, char) => sum + ctx.measureText(char).width, 0) + tracking * Math.max(characters.length - 1, 0);

  let currentX = align === "center" ? x - totalWidth / 2 : x;

  for (const char of characters) {
    ctx.fillText(char, currentX, y);
    currentX += ctx.measureText(char).width + tracking;
  }
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign
) {
  const lines = getLines(ctx, text, maxWidth);
  ctx.textAlign = align;

  lines.forEach((line, index) => {
    ctx.fillText(line, x, startY + index * lineHeight);
  });

  return startY + lines.length * lineHeight;
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
) {
  const scale = Math.max(targetWidth / img.naturalWidth, targetHeight / img.naturalHeight);
  const drawWidth = img.naturalWidth * scale;
  const drawHeight = img.naturalHeight * scale;
  const dx = (targetWidth - drawWidth) / 2;
  const dy = (targetHeight - drawHeight) / 2;

  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
}

function assertCanvasIsNotBlank(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable for validation");

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const columns = 18;
  const rows = 24;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const x = Math.floor((col / (columns - 1)) * (canvas.width - 1));
      const y = Math.floor((row / (rows - 1)) * (canvas.height - 1));
      const index = (y * canvas.width + x) * 4;
      const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
      const alpha = data[index + 3];

      if (alpha > 0 && brightness < 250) {
        return;
      }
    }
  }

  throw new Error("Invite image rendered blank");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load invite asset: ${src}`));
    image.src = src;
  });
}

/**
 * Renders the selected invite template directly to canvas so email images do not depend on DOM screenshots.
 */
export async function renderInviteToBlob(opts: RenderOptions): Promise<Blob> {
  const style = TEMPLATE_STYLES[opts.templateId] || TEMPLATE_STYLES["baby-blocks"];
  const backgroundImage = await loadImage(style.backgroundSrc);
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context");

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawImageCover(ctx, backgroundImage, CANVAS_WIDTH, CANVAS_HEIGHT);

  const dateText = opts.eventDate ? format(opts.eventDate, "MMMM d, yyyy") : "Date TBD";
  const details = [dateText, opts.timeRange?.trim(), opts.location.trim()].filter(Boolean) as string[];

  let y = style.contentTop;
  ctx.textBaseline = "top";

  ctx.fillStyle = style.introColor;
  ctx.font = '600 24px Georgia, "Times New Roman", serif';
  drawTrackedText(ctx, style.introText, style.contentX, y, style.tracking, style.align);
  y += 52;

  ctx.fillStyle = style.titleColor;
  ctx.font = style.titleFont;
  y = drawWrappedText(ctx, opts.title.trim(), style.contentX, y, style.contentWidth, style.titleLineHeight, style.align);
  y += 20;

  ctx.strokeStyle = style.dividerColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(style.contentX - style.dividerWidth / 2, y);
  ctx.lineTo(style.contentX + style.dividerWidth / 2, y);
  ctx.stroke();
  y += 28;

  ctx.fillStyle = style.detailColor;
  ctx.font = style.detailFont;
  for (const detail of details) {
    y = drawWrappedText(ctx, detail, style.contentX, y, style.contentWidth, style.detailLineHeight, style.align);
    y += 6;
  }

  y += 24;
  ctx.fillStyle = style.messageColor;
  ctx.font = style.messageFont;
  drawWrappedText(ctx, opts.message.trim(), style.contentX, y, style.messageWidth, style.messageLineHeight, style.align);

  assertCanvasIsNotBlank(canvas);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas toBlob failed"));
      }
    }, "image/png", 0.95);
  });
}
