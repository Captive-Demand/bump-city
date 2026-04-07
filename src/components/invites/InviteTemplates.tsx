import { format } from "date-fns";

export interface InviteData {
  title: string;
  eventDate?: Date;
  location: string;
  message: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  thumbBg: string;
  thumbAccent: string;
  thumbText: string;
}

export const templateConfigs: TemplateConfig[] = [
  { id: "blush-elegance", name: "Blush Elegance", thumbBg: "#f9e8e8", thumbAccent: "#c9a96e", thumbText: "#5a3e3e" },
  { id: "garden-party", name: "Garden Party", thumbBg: "#e8f5e9", thumbAccent: "#4caf50", thumbText: "#2e4830" },
  { id: "safari-adventure", name: "Safari Adventure", thumbBg: "#f5e6d0", thumbAccent: "#8d6e3f", thumbText: "#3e2a0e" },
  { id: "ocean-dreams", name: "Ocean Dreams", thumbBg: "#0d4f5c", thumbAccent: "#4dd0e1", thumbText: "#ffffff" },
  { id: "woodland-whimsy", name: "Woodland Whimsy", thumbBg: "#ede0c8", thumbAccent: "#5d7a3a", thumbText: "#3b2f1e" },
  { id: "modern-minimal", name: "Modern Minimal", thumbBg: "#ffffff", thumbAccent: "#000000", thumbText: "#000000" },
  { id: "boho-sunset", name: "Boho Sunset", thumbBg: "#e8a87c", thumbAccent: "#c1666b", thumbText: "#4a2c2a" },
  { id: "starry-night", name: "Starry Night", thumbBg: "#1a1a40", thumbAccent: "#d4af37", thumbText: "#f0e6d3" },
];

const DateLine = ({ date }: { date?: Date }) =>
  date ? <p className="text-sm font-medium">{format(date, "EEEE, MMMM do, yyyy")}</p> : null;

const LocationLine = ({ location }: { location: string }) =>
  location ? <p className="text-sm opacity-80">📍 {location}</p> : null;

/* ─── 1. Blush Elegance ─── */
const BlushElegance = ({ title, eventDate, location, message }: InviteData) => (
  <div className="relative rounded-xl overflow-hidden" style={{ background: "#f9e8e8" }}>
    {/* Corner flourishes */}
    <svg className="absolute top-0 left-0 w-16 h-16 opacity-40" viewBox="0 0 64 64"><path d="M0 0 Q32 8 8 32 Q4 48 0 64" fill="none" stroke="#c9a96e" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" fill="#c9a96e"/></svg>
    <svg className="absolute top-0 right-0 w-16 h-16 opacity-40" viewBox="0 0 64 64" style={{ transform: "scaleX(-1)" }}><path d="M0 0 Q32 8 8 32 Q4 48 0 64" fill="none" stroke="#c9a96e" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" fill="#c9a96e"/></svg>
    <svg className="absolute bottom-0 left-0 w-16 h-16 opacity-40" viewBox="0 0 64 64" style={{ transform: "scaleY(-1)" }}><path d="M0 0 Q32 8 8 32 Q4 48 0 64" fill="none" stroke="#c9a96e" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" fill="#c9a96e"/></svg>
    <svg className="absolute bottom-0 right-0 w-16 h-16 opacity-40" viewBox="0 0 64 64" style={{ transform: "scale(-1)" }}><path d="M0 0 Q32 8 8 32 Q4 48 0 64" fill="none" stroke="#c9a96e" strokeWidth="1.5"/><circle cx="8" cy="8" r="2" fill="#c9a96e"/></svg>

    <div className="px-8 py-12 text-center space-y-4 border-2 m-3 rounded-lg" style={{ borderColor: "#c9a96e33", color: "#5a3e3e" }}>
      <p className="text-xs uppercase tracking-[0.3em] font-medium" style={{ color: "#c9a96e" }}>You're Invited</p>
      <h2 className="text-2xl font-serif font-bold italic">{title}</h2>
      <div className="w-16 h-px mx-auto" style={{ background: "#c9a96e" }} />
      <DateLine date={eventDate} />
      <LocationLine location={location} />
      <p className="text-sm leading-relaxed max-w-xs mx-auto">{message}</p>
      <button className="mt-2 px-6 py-2 rounded-full text-sm font-medium text-white" style={{ background: "#c9a96e" }}>RSVP Now</button>
    </div>
  </div>
);

/* ─── 2. Garden Party ─── */
const GardenParty = ({ title, eventDate, location, message }: InviteData) => (
  <div className="relative rounded-xl overflow-hidden flex" style={{ background: "#f5f9f0" }}>
    {/* Floral border strip */}
    <div className="w-12 shrink-0 relative" style={{ background: "#4caf50" }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <svg key={i} className="absolute w-8 h-8" style={{ top: `${i * 18}%`, left: "50%", transform: "translateX(-50%)", opacity: 0.4 }} viewBox="0 0 32 32">
          <circle cx="16" cy="10" r="4" fill="#fff" /><circle cx="10" cy="16" r="4" fill="#fff" /><circle cx="22" cy="16" r="4" fill="#fff" /><circle cx="16" cy="22" r="4" fill="#fff" /><circle cx="16" cy="16" r="3" fill="#ffeb3b" />
        </svg>
      ))}
    </div>
    <div className="flex-1 px-6 py-10 text-center space-y-3" style={{ color: "#2e4830" }}>
      <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#4caf50" }}>Please Join Us</p>
      <h2 className="text-2xl font-bold" style={{ fontFamily: "Georgia, serif" }}>{title}</h2>
      <div className="flex items-center justify-center gap-2">
        <span className="block w-8 h-px" style={{ background: "#4caf50" }} />
        <span style={{ color: "#4caf50" }}>🌿</span>
        <span className="block w-8 h-px" style={{ background: "#4caf50" }} />
      </div>
      <DateLine date={eventDate} />
      <LocationLine location={location} />
      <p className="text-sm leading-relaxed">{message}</p>
      <button className="mt-2 px-6 py-2 rounded-full text-sm font-medium text-white" style={{ background: "#4caf50" }}>RSVP Now</button>
    </div>
  </div>
);

/* ─── 3. Safari Adventure ─── */
const SafariAdventure = ({ title, eventDate, location, message }: InviteData) => (
  <div className="rounded-xl overflow-hidden" style={{ background: "#f5e6d0" }}>
    <div className="h-3" style={{ background: "repeating-linear-gradient(90deg, #8d6e3f 0 8px, #f5e6d0 8px 12px)" }} />
    <div className="px-8 py-10 text-center space-y-4" style={{ color: "#3e2a0e" }}>
      <p className="text-xs uppercase tracking-[0.25em] font-bold" style={{ color: "#8d6e3f" }}>You're Invited To</p>
      <h2 className="text-3xl font-extrabold uppercase tracking-wide">{title}</h2>
      <div className="flex justify-center gap-1">
        {["🦒", "🌿", "🐘"].map((e, i) => <span key={i} className="text-lg">{e}</span>)}
      </div>
      <DateLine date={eventDate} />
      <LocationLine location={location} />
      <p className="text-sm leading-relaxed">{message}</p>
      <button className="mt-2 px-6 py-2 rounded-full text-sm font-bold uppercase text-white" style={{ background: "#8d6e3f" }}>RSVP Now</button>
    </div>
    <div className="h-3" style={{ background: "repeating-linear-gradient(90deg, #8d6e3f 0 8px, #f5e6d0 8px 12px)" }} />
  </div>
);

/* ─── 4. Ocean Dreams ─── */
const OceanDreams = ({ title, eventDate, location, message }: InviteData) => (
  <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(180deg, #0d4f5c 0%, #1a8a9e 50%, #4dd0e1 100%)" }}>
    <div className="px-8 pt-10 pb-2 text-center space-y-3 text-white">
      <p className="text-xs uppercase tracking-[0.3em] font-medium opacity-80">You're Invited</p>
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
    {/* Wave SVG divider */}
    <svg viewBox="0 0 400 40" className="w-full" preserveAspectRatio="none">
      <path d="M0 20 Q50 0 100 20 Q150 40 200 20 Q250 0 300 20 Q350 40 400 20 L400 40 L0 40 Z" fill="#0d4f5c" opacity="0.3" />
      <path d="M0 25 Q50 10 100 25 Q150 40 200 25 Q250 10 300 25 Q350 40 400 25 L400 40 L0 40 Z" fill="#0d4f5c" opacity="0.15" />
    </svg>
    <div className="px-8 pb-10 text-center space-y-3 text-white">
      <DateLine date={eventDate} />
      <LocationLine location={location} />
      <p className="text-sm leading-relaxed opacity-90">{message}</p>
      <button className="mt-2 px-6 py-2 rounded-full text-sm font-medium" style={{ background: "#fff", color: "#0d4f5c" }}>RSVP Now</button>
    </div>
  </div>
);

/* ─── 5. Woodland Whimsy ─── */
const WoodlandWhimsy = ({ title, eventDate, location, message }: InviteData) => (
  <div className="relative rounded-xl overflow-hidden" style={{ background: "#ede0c8" }}>
    {/* Branch decorations */}
    <svg className="absolute top-2 right-2 w-24 h-24 opacity-20" viewBox="0 0 100 100"><path d="M80 10 Q60 30 50 50 Q45 65 30 80" fill="none" stroke="#5d7a3a" strokeWidth="2"/><ellipse cx="75" cy="15" rx="6" ry="3" fill="#5d7a3a" transform="rotate(-30 75 15)"/><ellipse cx="55" cy="40" rx="6" ry="3" fill="#5d7a3a" transform="rotate(-50 55 40)"/></svg>
    <svg className="absolute bottom-2 left-2 w-24 h-24 opacity-20" viewBox="0 0 100 100" style={{ transform: "scale(-1)" }}><path d="M80 10 Q60 30 50 50 Q45 65 30 80" fill="none" stroke="#5d7a3a" strokeWidth="2"/><ellipse cx="75" cy="15" rx="6" ry="3" fill="#5d7a3a" transform="rotate(-30 75 15)"/><ellipse cx="55" cy="40" rx="6" ry="3" fill="#5d7a3a" transform="rotate(-50 55 40)"/></svg>

    <div className="px-8 py-12 text-center space-y-4" style={{ color: "#3b2f1e" }}>
      <p className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: "#5d7a3a" }}>🌿 You're Invited 🌿</p>
      <h2 className="text-2xl font-bold" style={{ fontFamily: "Georgia, serif" }}>{title}</h2>
      <DateLine date={eventDate} />
      <LocationLine location={location} />
      <p className="text-sm leading-relaxed max-w-xs mx-auto">{message}</p>
      <button className="mt-2 px-6 py-2 rounded-full text-sm font-medium text-white" style={{ background: "#5d7a3a" }}>RSVP Now</button>
    </div>
  </div>
);

/* ─── 6. Modern Minimal ─── */
const ModernMinimal = ({ title, eventDate, location, message }: InviteData) => (
  <div className="rounded-xl overflow-hidden bg-white border" style={{ borderColor: "#e0e0e0" }}>
    <div className="px-8 py-14 text-center space-y-5" style={{ color: "#111" }}>
      <p className="text-[10px] uppercase tracking-[0.4em] font-medium text-gray-400">Invitation</p>
      <h2 className="text-3xl font-black tracking-tight">{title}</h2>
      <div className="w-12 h-0.5 mx-auto bg-black" />
      <DateLine date={eventDate} />
      <LocationLine location={location} />
      <p className="text-sm leading-relaxed text-gray-600 max-w-xs mx-auto">{message}</p>
      <button className="mt-3 px-8 py-2.5 text-sm font-semibold bg-black text-white rounded-none uppercase tracking-wider">RSVP</button>
    </div>
  </div>
);

/* ─── 7. Boho Sunset ─── */
const BohoSunset = ({ title, eventDate, location, message }: InviteData) => (
  <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(180deg, #e8a87c 0%, #d4856a 40%, #c1666b 100%)" }}>
    <div className="px-8 py-10 text-center">
      {/* Arch frame */}
      <div className="mx-auto max-w-[260px] rounded-t-full border-2 border-white/30 px-6 pt-10 pb-8 space-y-3" style={{ color: "#4a2c2a" }}>
        <p className="text-xs uppercase tracking-[0.3em] font-medium text-white/80">You're Invited</p>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <div className="flex justify-center gap-1 text-white/60 text-xs">✦ ✦ ✦</div>
        <div className="text-white/90">
          <DateLine date={eventDate} />
          <LocationLine location={location} />
        </div>
        <p className="text-sm leading-relaxed text-white/85">{message}</p>
        <button className="mt-2 px-6 py-2 rounded-full text-sm font-medium" style={{ background: "rgba(255,255,255,0.9)", color: "#c1666b" }}>RSVP Now</button>
      </div>
    </div>
  </div>
);

/* ─── 8. Starry Night ─── */
const StarryNight = ({ title, eventDate, location, message }: InviteData) => (
  <div className="rounded-xl overflow-hidden relative" style={{
    background: "radial-gradient(circle at 20% 30%, #2a2a5c 0%, #1a1a40 50%, #0f0f2d 100%)",
  }}>
    {/* Stars */}
    <div className="absolute inset-0" style={{
      backgroundImage: "radial-gradient(1px 1px at 10% 15%, #fff 50%, transparent 100%), radial-gradient(1px 1px at 30% 40%, #fff 50%, transparent 100%), radial-gradient(1.5px 1.5px at 50% 10%, #d4af37 50%, transparent 100%), radial-gradient(1px 1px at 70% 60%, #fff 50%, transparent 100%), radial-gradient(1px 1px at 85% 25%, #fff 50%, transparent 100%), radial-gradient(1.5px 1.5px at 15% 70%, #d4af37 50%, transparent 100%), radial-gradient(1px 1px at 60% 80%, #fff 50%, transparent 100%), radial-gradient(1px 1px at 40% 55%, #fff 50%, transparent 100%), radial-gradient(1.5px 1.5px at 90% 75%, #d4af37 50%, transparent 100%)",
    }} />
    <div className="relative px-8 py-12 text-center space-y-4" style={{ color: "#f0e6d3" }}>
      <p className="text-xs uppercase tracking-[0.3em] font-medium" style={{ color: "#d4af37" }}>✨ You're Invited ✨</p>
      <h2 className="text-2xl font-bold" style={{ color: "#d4af37" }}>{title}</h2>
      <div className="w-16 h-px mx-auto" style={{ background: "#d4af3755" }} />
      <DateLine date={eventDate} />
      <LocationLine location={location} />
      <p className="text-sm leading-relaxed opacity-90">{message}</p>
      <button className="mt-2 px-6 py-2 rounded-full text-sm font-medium" style={{ background: "#d4af37", color: "#1a1a40" }}>RSVP Now</button>
    </div>
  </div>
);

export const templates: Record<string, React.FC<InviteData>> = {
  "blush-elegance": BlushElegance,
  "garden-party": GardenParty,
  "safari-adventure": SafariAdventure,
  "ocean-dreams": OceanDreams,
  "woodland-whimsy": WoodlandWhimsy,
  "modern-minimal": ModernMinimal,
  "boho-sunset": BohoSunset,
  "starry-night": StarryNight,
};
