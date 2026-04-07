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

const DateLine = ({ date, color }: { date?: Date; color?: string }) =>
  date ? (
    <p className="text-base font-medium tracking-wide" style={{ color }}>
      {format(date, "EEEE, MMMM do, yyyy")}
    </p>
  ) : null;

const LocationLine = ({ location, color }: { location: string; color?: string }) =>
  location ? (
    <p className="text-sm tracking-wide" style={{ color, opacity: 0.85 }}>
      {location}
    </p>
  ) : null;

/* ═══════════════════════════════════════════════
   1. BLUSH ELEGANCE — Gold filigree, serif luxury
   ═══════════════════════════════════════════════ */
const BlushElegance = ({ title, eventDate, location, message }: InviteData) => (
  <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(170deg, #fdf2f0 0%, #f9e8e8 40%, #f5dcd8 100%)" }}>
    {/* Ornate corner flourishes */}
    <svg className="absolute top-0 left-0 w-28 h-28" viewBox="0 0 120 120" fill="none">
      <path d="M10 5 Q25 5 30 20 Q35 40 20 50 Q10 55 5 70" stroke="#c9a96e" strokeWidth="1" opacity="0.6" fill="none"/>
      <path d="M5 10 Q20 15 25 30 Q28 42 18 48" stroke="#c9a96e" strokeWidth="0.8" opacity="0.4" fill="none"/>
      <circle cx="10" cy="5" r="2" fill="#c9a96e" opacity="0.5"/>
      <circle cx="5" cy="70" r="1.5" fill="#c9a96e" opacity="0.4"/>
      <path d="M30 5 Q35 12 32 22" stroke="#c9a96e" strokeWidth="0.6" opacity="0.3" fill="none"/>
      <path d="M5 30 Q12 28 18 35" stroke="#c9a96e" strokeWidth="0.6" opacity="0.3" fill="none"/>
    </svg>
    <svg className="absolute top-0 right-0 w-28 h-28" viewBox="0 0 120 120" fill="none" style={{ transform: "scaleX(-1)" }}>
      <path d="M10 5 Q25 5 30 20 Q35 40 20 50 Q10 55 5 70" stroke="#c9a96e" strokeWidth="1" opacity="0.6" fill="none"/>
      <path d="M5 10 Q20 15 25 30 Q28 42 18 48" stroke="#c9a96e" strokeWidth="0.8" opacity="0.4" fill="none"/>
      <circle cx="10" cy="5" r="2" fill="#c9a96e" opacity="0.5"/>
      <circle cx="5" cy="70" r="1.5" fill="#c9a96e" opacity="0.4"/>
    </svg>
    <svg className="absolute bottom-0 left-0 w-28 h-28" viewBox="0 0 120 120" fill="none" style={{ transform: "scaleY(-1)" }}>
      <path d="M10 5 Q25 5 30 20 Q35 40 20 50 Q10 55 5 70" stroke="#c9a96e" strokeWidth="1" opacity="0.6" fill="none"/>
      <path d="M5 10 Q20 15 25 30 Q28 42 18 48" stroke="#c9a96e" strokeWidth="0.8" opacity="0.4" fill="none"/>
      <circle cx="10" cy="5" r="2" fill="#c9a96e" opacity="0.5"/>
    </svg>
    <svg className="absolute bottom-0 right-0 w-28 h-28" viewBox="0 0 120 120" fill="none" style={{ transform: "scale(-1)" }}>
      <path d="M10 5 Q25 5 30 20 Q35 40 20 50 Q10 55 5 70" stroke="#c9a96e" strokeWidth="1" opacity="0.6" fill="none"/>
      <path d="M5 10 Q20 15 25 30 Q28 42 18 48" stroke="#c9a96e" strokeWidth="0.8" opacity="0.4" fill="none"/>
      <circle cx="10" cy="5" r="2" fill="#c9a96e" opacity="0.5"/>
    </svg>

    {/* Double border frame */}
    <div className="m-5 border rounded-lg" style={{ borderColor: "#c9a96e44" }}>
      <div className="m-2 border rounded-lg" style={{ borderColor: "#c9a96e22" }}>
        <div className="px-10 py-16 text-center space-y-5" style={{ color: "#5a3e3e" }}>
          <p className="text-[11px] uppercase tracking-[0.45em] font-medium" style={{ color: "#c9a96e" }}>
            You Are Cordially Invited
          </p>
          <h2 className="text-3xl font-bold italic" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {title}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-px" style={{ background: "linear-gradient(90deg, transparent, #c9a96e)" }} />
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#c9a96e" opacity="0.6"/></svg>
            <div className="w-12 h-px" style={{ background: "linear-gradient(90deg, #c9a96e, transparent)" }} />
          </div>
          <DateLine date={eventDate} color="#5a3e3e" />
          <LocationLine location={location} color="#7a5e5e" />
          <p className="text-sm leading-relaxed max-w-[280px] mx-auto" style={{ color: "#7a5e5e", lineHeight: "1.8" }}>
            {message}
          </p>
          <button
            className="mt-4 px-8 py-2.5 rounded-full text-sm font-medium tracking-wider uppercase transition-all"
            style={{
              background: "linear-gradient(135deg, #c9a96e, #dfc08a)",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(201, 169, 110, 0.3)",
              letterSpacing: "0.1em",
            }}
          >
            RSVP
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════
   2. GARDEN PARTY — Botanical SVG borders
   ═══════════════════════════════════════════════ */
const GardenParty = ({ title, eventDate, location, message }: InviteData) => (
  <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(180deg, #f7faf3 0%, #eef5e6 100%)" }}>
    {/* Left botanical border */}
    <div className="absolute left-0 top-0 bottom-0 w-16">
      <svg className="w-full h-full" viewBox="0 0 60 400" preserveAspectRatio="none" fill="none">
        <path d="M30 0 L30 400" stroke="#4caf50" strokeWidth="1" opacity="0.2"/>
        {/* Leaves along the stem */}
        {[40, 100, 160, 220, 280, 340].map((y, i) => (
          <g key={i}>
            <ellipse cx={i % 2 === 0 ? 18 : 42} cy={y} rx="12" ry="6" fill="#4caf50" opacity="0.15" transform={`rotate(${i % 2 === 0 ? -30 : 30} ${i % 2 === 0 ? 18 : 42} ${y})`}/>
            <ellipse cx={i % 2 === 0 ? 20 : 40} cy={y + 5} rx="8" ry="4" fill="#66bb6a" opacity="0.1" transform={`rotate(${i % 2 === 0 ? -20 : 20} ${i % 2 === 0 ? 20 : 40} ${y + 5})`}/>
          </g>
        ))}
        {/* Small flower buds */}
        {[70, 190, 310].map((y, i) => (
          <g key={`f${i}`}>
            <circle cx={i % 2 === 0 ? 15 : 45} cy={y} r="4" fill="#e8f5e9" opacity="0.6"/>
            <circle cx={i % 2 === 0 ? 15 : 45} cy={y} r="2" fill="#ffeb3b" opacity="0.4"/>
          </g>
        ))}
      </svg>
    </div>

    {/* Top vine */}
    <svg className="absolute top-0 left-12 right-0 h-10" viewBox="0 0 300 30" fill="none" preserveAspectRatio="none">
      <path d="M0 20 Q75 5 150 18 Q225 30 300 12" stroke="#4caf50" strokeWidth="1" opacity="0.2" fill="none"/>
      {[50, 120, 200, 270].map((x, i) => (
        <ellipse key={i} cx={x} cy={i % 2 === 0 ? 14 : 20} rx="8" ry="4" fill="#4caf50" opacity="0.12" transform={`rotate(${15 - i * 10} ${x} ${i % 2 === 0 ? 14 : 20})`}/>
      ))}
    </svg>

    <div className="relative pl-20 pr-8 py-16 text-center space-y-5" style={{ color: "#2e4830" }}>
      <p className="text-[11px] uppercase tracking-[0.4em] font-semibold" style={{ color: "#4caf50" }}>
        Please Join Us For
      </p>
      <h2 className="text-3xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
        {title}
      </h2>
      <div className="flex items-center justify-center gap-3">
        <div className="w-10 h-px" style={{ background: "#4caf50", opacity: 0.4 }} />
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2 Q10 6 8 8 Q6 6 8 2Z" fill="#4caf50" opacity="0.5"/>
          <path d="M8 2 Q12 5 10 8 Q9 6 8 2Z" fill="#66bb6a" opacity="0.3"/>
          <path d="M8 2 Q4 5 6 8 Q7 6 8 2Z" fill="#66bb6a" opacity="0.3"/>
        </svg>
        <div className="w-10 h-px" style={{ background: "#4caf50", opacity: 0.4 }} />
      </div>
      <DateLine date={eventDate} color="#2e4830" />
      <LocationLine location={location} color="#4a6a4c" />
      <p className="text-sm leading-relaxed max-w-[260px] mx-auto" style={{ color: "#4a6a4c", lineHeight: "1.8" }}>
        {message}
      </p>
      <button
        className="mt-4 px-8 py-2.5 rounded-full text-sm font-semibold tracking-wider uppercase transition-all"
        style={{
          background: "linear-gradient(135deg, #4caf50, #66bb6a)",
          color: "#fff",
          boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)",
          letterSpacing: "0.1em",
        }}
      >
        RSVP
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════
   3. SAFARI ADVENTURE — Elegant silhouettes, linen texture
   ═══════════════════════════════════════════════ */
const SafariAdventure = ({ title, eventDate, location, message }: InviteData) => (
  <div className="rounded-xl overflow-hidden relative" style={{
    background: "#f5e6d0",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%238d6e3f' fill-opacity='0.04'%3E%3Cpath d='M0 0h20v20H0zM20 20h20v20H20z'/%3E%3C/g%3E%3C/svg%3E\")",
  }}>
    {/* Top decorative bar */}
    <div className="h-1.5" style={{ background: "linear-gradient(90deg, #8d6e3f, #c9a96e, #8d6e3f)" }} />

    {/* Animal silhouettes */}
    <svg className="absolute top-16 right-6 w-20 h-20 opacity-[0.08]" viewBox="0 0 80 80" fill="#3e2a0e">
      {/* Giraffe silhouette */}
      <path d="M45 10 L47 8 L49 10 L48 25 Q48 30 50 32 L52 34 L52 55 L50 55 L50 45 L48 45 L48 55 L46 55 L46 35 Q44 32 44 28 L44 10Z"/>
    </svg>
    <svg className="absolute bottom-16 left-6 w-16 h-16 opacity-[0.08]" viewBox="0 0 64 64" fill="#3e2a0e">
      {/* Elephant silhouette */}
      <path d="M15 25 Q10 20 12 15 Q14 12 18 15 L20 20 Q25 18 35 18 Q45 18 48 22 Q52 28 50 35 L50 45 L46 45 L46 38 L42 38 L42 45 L38 45 L38 35 L25 35 L25 45 L21 45 L21 38 L18 38 L18 45 L14 45 L14 35 Q12 30 15 25Z"/>
    </svg>

    <div className="relative px-10 py-16 text-center space-y-5" style={{ color: "#3e2a0e" }}>
      <p className="text-[11px] uppercase tracking-[0.5em] font-bold" style={{ color: "#8d6e3f" }}>
        You Are Invited To
      </p>
      <h2 className="text-4xl font-extrabold uppercase tracking-wider" style={{ fontFamily: "Georgia, serif", letterSpacing: "0.08em" }}>
        {title}
      </h2>
      <div className="flex justify-center items-center gap-4">
        <div className="w-16 h-px" style={{ background: "linear-gradient(90deg, transparent, #8d6e3f)" }} />
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
          <path d="M0 5 L5 0 L10 5 L15 0 L20 5" stroke="#8d6e3f" strokeWidth="1.2" opacity="0.5"/>
        </svg>
        <div className="w-16 h-px" style={{ background: "linear-gradient(90deg, #8d6e3f, transparent)" }} />
      </div>
      <DateLine date={eventDate} color="#3e2a0e" />
      <LocationLine location={location} color="#5a4a2e" />
      <p className="text-sm leading-relaxed max-w-[280px] mx-auto" style={{ color: "#5a4a2e", lineHeight: "1.8" }}>
        {message}
      </p>
      <button
        className="mt-4 px-8 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all"
        style={{
          background: "linear-gradient(135deg, #8d6e3f, #a68550)",
          color: "#fff",
          boxShadow: "0 4px 15px rgba(141, 110, 63, 0.3)",
          letterSpacing: "0.12em",
        }}
      >
        RSVP
      </button>
    </div>

    <div className="h-1.5" style={{ background: "linear-gradient(90deg, #8d6e3f, #c9a96e, #8d6e3f)" }} />
  </div>
);

/* ═══════════════════════════════════════════════
   4. OCEAN DREAMS — Layered waves, frosted glass
   ═══════════════════════════════════════════════ */
const OceanDreams = ({ title, eventDate, location, message }: InviteData) => (
  <div className="rounded-xl overflow-hidden" style={{
    background: "linear-gradient(180deg, #0a3d47 0%, #0d5a6b 30%, #1a8a9e 60%, #3dbdd4 100%)",
  }}>
    {/* Subtle bubble dots */}
    <div className="absolute inset-0 overflow-hidden">
      {[
        { x: "15%", y: "20%", r: 3 }, { x: "75%", y: "15%", r: 2 }, { x: "85%", y: "45%", r: 4 },
        { x: "25%", y: "70%", r: 2.5 }, { x: "60%", y: "80%", r: 3 }, { x: "40%", y: "30%", r: 1.5 },
      ].map((b, i) => (
        <div key={i} className="absolute rounded-full" style={{
          left: b.x, top: b.y, width: b.r * 2, height: b.r * 2,
          background: "rgba(255,255,255,0.08)",
        }} />
      ))}
    </div>

    <div className="relative px-10 pt-16 pb-4 text-center space-y-4 text-white">
      <p className="text-[11px] uppercase tracking-[0.45em] font-medium" style={{ color: "#a0e8f5" }}>
        You Are Invited
      </p>
      <h2 className="text-3xl font-bold" style={{ fontFamily: "Georgia, serif", textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
        {title}
      </h2>
    </div>

    {/* Triple wave divider */}
    <svg viewBox="0 0 400 60" className="w-full relative" preserveAspectRatio="none" style={{ marginTop: "-4px" }}>
      <path d="M0 30 Q40 10 80 25 Q120 40 160 25 Q200 10 240 25 Q280 40 320 25 Q360 10 400 30 L400 60 L0 60Z" fill="#0d5a6b" opacity="0.2"/>
      <path d="M0 35 Q50 15 100 30 Q150 45 200 30 Q250 15 300 30 Q350 45 400 35 L400 60 L0 60Z" fill="#0d5a6b" opacity="0.15"/>
      <path d="M0 40 Q60 22 120 38 Q180 50 240 35 Q300 20 360 38 Q380 45 400 40 L400 60 L0 60Z" fill="#0d5a6b" opacity="0.1"/>
    </svg>

    <div className="relative px-10 pb-16 text-center space-y-4 text-white">
      <DateLine date={eventDate} color="#d0f0f8" />
      <LocationLine location={location} color="#a0dce8" />
      <p className="text-sm leading-relaxed max-w-[280px] mx-auto" style={{ color: "#c8eef5", lineHeight: "1.8" }}>
        {message}
      </p>
      <button
        className="mt-4 px-8 py-2.5 rounded-full text-sm font-semibold tracking-wider uppercase transition-all"
        style={{
          background: "rgba(255,255,255,0.9)",
          color: "#0d4f5c",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          backdropFilter: "blur(10px)",
          letterSpacing: "0.1em",
        }}
      >
        RSVP
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════
   5. WOODLAND WHIMSY — Detailed branch frames
   ═══════════════════════════════════════════════ */
const WoodlandWhimsy = ({ title, eventDate, location, message }: InviteData) => (
  <div className="relative rounded-xl overflow-hidden" style={{
    background: "linear-gradient(170deg, #f0e4cc 0%, #ede0c8 50%, #e8d8b8 100%)",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%235d7a3a' stroke-opacity='0.03' stroke-width='1'%3E%3Cpath d='M30 0v60M0 30h60'/%3E%3C/g%3E%3C/svg%3E\")",
  }}>
    {/* Corner branches */}
    <svg className="absolute top-0 right-0 w-32 h-32" viewBox="0 0 120 120" fill="none">
      <path d="M120 0 Q100 20 90 40 Q85 55 75 65 Q70 70 60 72" stroke="#5d7a3a" strokeWidth="1.5" opacity="0.25"/>
      <ellipse cx="95" cy="25" rx="10" ry="5" fill="#5d7a3a" opacity="0.12" transform="rotate(-40 95 25)"/>
      <ellipse cx="85" cy="45" rx="9" ry="4" fill="#5d7a3a" opacity="0.1" transform="rotate(-55 85 45)"/>
      <ellipse cx="72" cy="60" rx="8" ry="4" fill="#5d7a3a" opacity="0.08" transform="rotate(-65 72 60)"/>
      <circle cx="100" cy="18" r="3" fill="#8b5e3c" opacity="0.08"/>
      <circle cx="78" cy="52" r="2.5" fill="#8b5e3c" opacity="0.06"/>
    </svg>
    <svg className="absolute bottom-0 left-0 w-32 h-32" viewBox="0 0 120 120" fill="none" style={{ transform: "scale(-1)" }}>
      <path d="M120 0 Q100 20 90 40 Q85 55 75 65 Q70 70 60 72" stroke="#5d7a3a" strokeWidth="1.5" opacity="0.25"/>
      <ellipse cx="95" cy="25" rx="10" ry="5" fill="#5d7a3a" opacity="0.12" transform="rotate(-40 95 25)"/>
      <ellipse cx="85" cy="45" rx="9" ry="4" fill="#5d7a3a" opacity="0.1" transform="rotate(-55 85 45)"/>
      <ellipse cx="72" cy="60" rx="8" ry="4" fill="#5d7a3a" opacity="0.08" transform="rotate(-65 72 60)"/>
    </svg>
    {/* Acorn accent */}
    <svg className="absolute top-4 left-4 w-8 h-8 opacity-[0.12]" viewBox="0 0 24 24" fill="#5d7a3a">
      <ellipse cx="12" cy="10" rx="5" ry="4"/>
      <path d="M8 10 Q8 18 12 20 Q16 18 16 10"/>
      <rect x="11" y="4" width="2" height="4" rx="1"/>
    </svg>

    <div className="relative px-10 py-16 text-center space-y-5" style={{ color: "#3b2f1e" }}>
      <p className="text-[11px] uppercase tracking-[0.4em] font-medium" style={{ color: "#5d7a3a" }}>
        You Are Invited
      </p>
      <h2 className="text-3xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
        {title}
      </h2>
      <div className="flex items-center justify-center gap-3">
        <div className="w-10 h-px" style={{ background: "#5d7a3a", opacity: 0.3 }} />
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1 Q9 4 7 7 Q5 4 7 1Z" fill="#5d7a3a" opacity="0.4"/>
          <path d="M7 3 Q11 5 9 8" stroke="#5d7a3a" strokeWidth="0.8" opacity="0.3" fill="none"/>
          <path d="M7 3 Q3 5 5 8" stroke="#5d7a3a" strokeWidth="0.8" opacity="0.3" fill="none"/>
        </svg>
        <div className="w-10 h-px" style={{ background: "#5d7a3a", opacity: 0.3 }} />
      </div>
      <DateLine date={eventDate} color="#3b2f1e" />
      <LocationLine location={location} color="#5a4e3e" />
      <p className="text-sm leading-relaxed max-w-[280px] mx-auto" style={{ color: "#5a4e3e", lineHeight: "1.8" }}>
        {message}
      </p>
      <button
        className="mt-4 px-8 py-2.5 rounded-full text-sm font-semibold tracking-wider uppercase transition-all"
        style={{
          background: "linear-gradient(135deg, #5d7a3a, #6d8a4a)",
          color: "#fff",
          boxShadow: "0 4px 15px rgba(93, 122, 58, 0.3)",
          letterSpacing: "0.1em",
        }}
      >
        RSVP
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════
   6. MODERN MINIMAL — Dramatic typography, asymmetric
   ═══════════════════════════════════════════════ */
const ModernMinimal = ({ title, eventDate, location, message }: InviteData) => (
  <div className="rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #e8e8e8" }}>
    {/* Thin accent line at top */}
    <div className="h-0.5 bg-black" />

    <div className="px-10 py-16 space-y-6" style={{ color: "#111" }}>
      <p className="text-[10px] uppercase tracking-[0.5em] font-medium" style={{ color: "#999" }}>
        Invitation
      </p>
      <h2 className="text-4xl font-black tracking-tight leading-tight" style={{ fontFamily: "Georgia, serif", letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      <div className="w-16 h-0.5 bg-black" />
      <div className="space-y-2">
        <DateLine date={eventDate} color="#333" />
        <LocationLine location={location} color="#666" />
      </div>
      <p className="text-sm leading-relaxed max-w-[300px]" style={{ color: "#666", lineHeight: "1.9" }}>
        {message}
      </p>
      <button
        className="px-10 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all"
        style={{
          background: "#111",
          color: "#fff",
          boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
        }}
      >
        RSVP
      </button>
    </div>

    {/* Bottom accent */}
    <div className="h-0.5 bg-black" />
  </div>
);

/* ═══════════════════════════════════════════════
   7. BOHO SUNSET — Layered arches, dried flower motifs
   ═══════════════════════════════════════════════ */
const BohoSunset = ({ title, eventDate, location, message }: InviteData) => (
  <div className="rounded-xl overflow-hidden" style={{
    background: "linear-gradient(180deg, #f0c49f 0%, #e8a87c 25%, #d4856a 55%, #c1666b 100%)",
  }}>
    <div className="px-8 py-12 text-center">
      {/* Outer arch */}
      <div className="mx-auto max-w-[280px] rounded-t-full border-2 p-2" style={{ borderColor: "rgba(255,255,255,0.25)" }}>
        {/* Inner arch */}
        <div className="rounded-t-full border px-8 pt-12 pb-10 space-y-4" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
          {/* Dried flower SVG */}
          <svg className="mx-auto w-10 h-10 mb-2" viewBox="0 0 40 40" fill="none">
            <path d="M20 38 L20 18" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
            <path d="M20 18 Q15 12 18 8 Q20 5 22 8 Q25 12 20 18Z" fill="rgba(255,255,255,0.2)"/>
            <path d="M20 22 Q12 18 14 14" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none"/>
            <path d="M20 22 Q28 18 26 14" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none"/>
            <ellipse cx="14" cy="14" rx="3" ry="2" fill="rgba(255,255,255,0.15)" transform="rotate(-30 14 14)"/>
            <ellipse cx="26" cy="14" rx="3" ry="2" fill="rgba(255,255,255,0.15)" transform="rotate(30 26 14)"/>
          </svg>

          <p className="text-[11px] uppercase tracking-[0.45em] font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
            You Are Invited
          </p>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "Georgia, serif", textShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            {title}
          </h2>
          <div className="flex justify-center gap-2 text-white/40 text-xs tracking-[0.3em]">✦ ✦ ✦</div>
          <div className="space-y-1">
            <DateLine date={eventDate} color="rgba(255,255,255,0.9)" />
            <LocationLine location={location} color="rgba(255,255,255,0.75)" />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)", lineHeight: "1.8" }}>
            {message}
          </p>
          <button
            className="mt-3 px-7 py-2.5 rounded-full text-sm font-semibold tracking-wider uppercase transition-all"
            style={{
              background: "rgba(255,255,255,0.92)",
              color: "#c1666b",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              letterSpacing: "0.1em",
            }}
          >
            RSVP
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════
   8. STARRY NIGHT — Celestial, crescent moon, constellations
   ═══════════════════════════════════════════════ */
const StarryNight = ({ title, eventDate, location, message }: InviteData) => (
  <div className="rounded-xl overflow-hidden relative" style={{
    background: "radial-gradient(ellipse at 30% 20%, #2a2a5c 0%, #1a1a40 40%, #0f0f2d 100%)",
  }}>
    {/* Stars field */}
    <div className="absolute inset-0" style={{
      backgroundImage: [
        "radial-gradient(1px 1px at 8% 12%, rgba(255,255,255,0.7) 50%, transparent 100%)",
        "radial-gradient(1.5px 1.5px at 18% 35%, #d4af37 50%, transparent 100%)",
        "radial-gradient(1px 1px at 28% 8%, rgba(255,255,255,0.5) 50%, transparent 100%)",
        "radial-gradient(1px 1px at 42% 22%, rgba(255,255,255,0.6) 50%, transparent 100%)",
        "radial-gradient(2px 2px at 55% 8%, #d4af37 50%, transparent 100%)",
        "radial-gradient(1px 1px at 68% 18%, rgba(255,255,255,0.5) 50%, transparent 100%)",
        "radial-gradient(1px 1px at 78% 30%, rgba(255,255,255,0.4) 50%, transparent 100%)",
        "radial-gradient(1.5px 1.5px at 88% 15%, #d4af37 50%, transparent 100%)",
        "radial-gradient(1px 1px at 35% 55%, rgba(255,255,255,0.5) 50%, transparent 100%)",
        "radial-gradient(1px 1px at 62% 65%, rgba(255,255,255,0.4) 50%, transparent 100%)",
        "radial-gradient(1px 1px at 82% 58%, rgba(255,255,255,0.6) 50%, transparent 100%)",
        "radial-gradient(1.5px 1.5px at 15% 75%, #d4af37 50%, transparent 100%)",
        "radial-gradient(1px 1px at 50% 82%, rgba(255,255,255,0.5) 50%, transparent 100%)",
        "radial-gradient(1px 1px at 72% 78%, rgba(255,255,255,0.4) 50%, transparent 100%)",
        "radial-gradient(2px 2px at 92% 72%, #d4af37 50%, transparent 100%)",
      ].join(", "),
    }} />

    {/* Crescent moon */}
    <svg className="absolute top-6 right-8 w-12 h-12" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="12" fill="#d4af37" opacity="0.15"/>
      <path d="M22 8 A12 12 0 0 1 22 32 A9 9 0 0 0 22 8Z" fill="#d4af37" opacity="0.25"/>
    </svg>

    {/* Constellation lines */}
    <svg className="absolute top-12 left-6 w-20 h-16 opacity-[0.15]" viewBox="0 0 80 60" fill="none">
      <line x1="10" y1="10" x2="30" y2="25" stroke="#d4af37" strokeWidth="0.5"/>
      <line x1="30" y1="25" x2="55" y2="15" stroke="#d4af37" strokeWidth="0.5"/>
      <line x1="55" y1="15" x2="70" y2="35" stroke="#d4af37" strokeWidth="0.5"/>
      <line x1="30" y1="25" x2="40" y2="45" stroke="#d4af37" strokeWidth="0.5"/>
      <circle cx="10" cy="10" r="1.5" fill="#d4af37"/>
      <circle cx="30" cy="25" r="1.5" fill="#d4af37"/>
      <circle cx="55" cy="15" r="1.5" fill="#d4af37"/>
      <circle cx="70" cy="35" r="1.5" fill="#d4af37"/>
      <circle cx="40" cy="45" r="1.5" fill="#d4af37"/>
    </svg>

    <div className="relative px-10 py-16 text-center space-y-5" style={{ color: "#f0e6d3" }}>
      <p className="text-[11px] uppercase tracking-[0.45em] font-medium" style={{ color: "#d4af37" }}>
        You Are Invited
      </p>
      <h2 className="text-3xl font-bold" style={{
        fontFamily: "Georgia, serif",
        color: "#d4af37",
        textShadow: "0 0 20px rgba(212, 175, 55, 0.3)",
      }}>
        {title}
      </h2>
      <div className="flex items-center justify-center gap-3">
        <div className="w-12 h-px" style={{ background: "linear-gradient(90deg, transparent, #d4af3766)" }} />
        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z" fill="#d4af37" opacity="0.5"/></svg>
        <div className="w-12 h-px" style={{ background: "linear-gradient(90deg, #d4af3766, transparent)" }} />
      </div>
      <DateLine date={eventDate} color="#e8dcc8" />
      <LocationLine location={location} color="#c8bca8" />
      <p className="text-sm leading-relaxed max-w-[280px] mx-auto" style={{ color: "#d8ccb8", lineHeight: "1.8" }}>
        {message}
      </p>
      <button
        className="mt-4 px-8 py-2.5 rounded-full text-sm font-semibold tracking-wider uppercase transition-all"
        style={{
          background: "linear-gradient(135deg, #d4af37, #e8c84a)",
          color: "#1a1a40",
          boxShadow: "0 4px 20px rgba(212, 175, 55, 0.3)",
          letterSpacing: "0.1em",
        }}
      >
        RSVP
      </button>
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
