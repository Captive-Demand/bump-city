// Custom-generated baby shower gift imagery — wrapped presents, gift bags, gift tables.
import gifts1 from "@/assets/shower-placeholders/gifts-1.jpg";
import gifts2 from "@/assets/shower-placeholders/gifts-2.jpg";
import gifts3 from "@/assets/shower-placeholders/gifts-3.jpg";
import gifts4 from "@/assets/shower-placeholders/gifts-4.jpg";
import gifts5 from "@/assets/shower-placeholders/gifts-5.jpg";
import gifts6 from "@/assets/shower-placeholders/gifts-6.jpg";

const PLACEHOLDERS = [gifts1, gifts2, gifts3, gifts4, gifts5, gifts6];

// Stable hash so the same shower always gets the same placeholder.
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const getShowerPlaceholder = (key: string) =>
  PLACEHOLDERS[hash(key) % PLACEHOLDERS.length];

export const getShowerImage = (event: { id: string; event_image_url?: string | null }) =>
  event.event_image_url || getShowerPlaceholder(event.id);
