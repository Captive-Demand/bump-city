// Curated free Pexels images that read as "baby shower gifts" — wrapped presents,
// gift boxes, ribbons, pastel packaging, gift tables.
const PLACEHOLDERS = [
  // Pastel wrapped gifts / ribbons
  "https://images.pexels.com/photos/1666067/pexels-photo-1666067.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1303081/pexels-photo-1303081.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/264771/pexels-photo-264771.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1693650/pexels-photo-1693650.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1666069/pexels-photo-1666069.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/3014853/pexels-photo-3014853.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1303086/pexels-photo-1303086.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/5874713/pexels-photo-5874713.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/3303692/pexels-photo-3303692.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1666070/pexels-photo-1666070.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/6044226/pexels-photo-6044226.jpeg?auto=compress&cs=tinysrgb&w=1200",
];

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
