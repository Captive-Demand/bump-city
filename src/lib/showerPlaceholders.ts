// Curated free Pexels images that read as "baby shower" — pastel, florals, gifts, balloons.
// These are remote URLs (Pexels CDN) so no bundling needed.
const PLACEHOLDERS = [
  "https://images.pexels.com/photos/3933250/pexels-photo-3933250.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/3662824/pexels-photo-3662824.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/6849425/pexels-photo-6849425.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/6849426/pexels-photo-6849426.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/3933280/pexels-photo-3933280.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/8088495/pexels-photo-8088495.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/6849424/pexels-photo-6849424.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/3933257/pexels-photo-3933257.jpeg?auto=compress&cs=tinysrgb&w=1200",
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
