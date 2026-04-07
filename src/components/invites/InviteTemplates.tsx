import { format } from "date-fns";
import babyBlocksBg from "@/assets/invites/baby-blocks.png";
import floralWreathBg from "@/assets/invites/floral-wreath.png";
import blushRosesBg from "@/assets/invites/blush-roses.png";
import gardenPeonyBg from "@/assets/invites/garden-peony.png";
import sageLeafBg from "@/assets/invites/sage-leaf.png";
import vintageTulipBg from "@/assets/invites/vintage-tulip.png";

interface TemplateProps {
  title: string;
  eventDate?: Date;
  location: string;
  message: string;
}

const dateStr = (d?: Date) => (d ? format(d, "MMMM d, yyyy") : "Date TBD");

/* ─── 1. Baby Blocks ─── */
const BabyBlocks = ({ title, eventDate, location, message }: TemplateProps) => (
  <div className="relative w-full" style={{ aspectRatio: "5/7" }}>
    <img src={babyBlocksBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center" style={{ paddingTop: "22%", paddingBottom: "30%" }}>
      <p className="text-xs uppercase tracking-[0.35em] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#7a9bb5" }}>
        You're Invited To
      </p>
      <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#5a7a92" }}>
        {title}
      </h2>
      <div className="w-16 h-px my-3" style={{ backgroundColor: "#d4a0b0" }} />
      <p className="text-base mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#7a9bb5" }}>
        {dateStr(eventDate)}
      </p>
      {location && (
        <p className="text-base mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#7a9bb5" }}>
          {location}
        </p>
      )}
      <p className="text-sm leading-relaxed max-w-[70%] italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#9ab0bf" }}>
        {message}
      </p>
    </div>
  </div>
);

/* ─── 2. Floral Wreath ─── */
const FloralWreath = ({ title, eventDate, location, message }: TemplateProps) => (
  <div className="relative w-full" style={{ aspectRatio: "5/7" }}>
    <img src={floralWreathBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 flex flex-col items-center justify-center px-14 text-center" style={{ paddingTop: "18%", paddingBottom: "22%" }}>
      <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#b07850" }}>
        Please Join Us For
      </p>
      <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#5a6e50" }}>
        {title}
      </h2>
      <div className="w-14 h-px my-2.5" style={{ backgroundColor: "#c9a87a" }} />
      <p className="text-base font-light mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#6e8560" }}>
        {dateStr(eventDate)}
      </p>
      {location && (
        <p className="text-base font-light mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#6e8560" }}>
          {location}
        </p>
      )}
      <p className="text-sm leading-relaxed max-w-[75%] italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#8a7a60" }}>
        {message}
      </p>
    </div>
  </div>
);

/* ─── 3. Blush Roses ─── */
const BlushRoses = ({ title, eventDate, location, message }: TemplateProps) => (
  <div className="relative w-full" style={{ aspectRatio: "5/7" }}>
    <img src={blushRosesBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
      <p className="text-xs uppercase tracking-[0.35em] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#c4917e" }}>
        You're Invited
      </p>
      <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#8b6b60" }}>
        {title}
      </h2>
      <div className="w-16 h-px my-3" style={{ backgroundColor: "#d4a898" }} />
      <p className="text-base font-light mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#a08070" }}>
        {dateStr(eventDate)}
      </p>
      {location && (
        <p className="text-base font-light mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#a08070" }}>
          {location}
        </p>
      )}
      <p className="text-sm leading-relaxed max-w-[80%] italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#b09888" }}>
        {message}
      </p>
    </div>
  </div>
);

/* ─── 4. Garden Peony ─── */
const GardenPeony = ({ title, eventDate, location, message }: TemplateProps) => (
  <div className="relative w-full" style={{ aspectRatio: "5/7" }}>
    <img src={gardenPeonyBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center" style={{ paddingTop: "18%", paddingBottom: "16%" }}>
      <p className="text-xs uppercase tracking-[0.35em] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#6b7f60" }}>
        Together With Our Families
      </p>
      <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#4a5e40" }}>
        {title}
      </h2>
      <div className="w-14 h-px my-3" style={{ backgroundColor: "#8a9e7a" }} />
      <p className="text-base mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5a6e50" }}>
        {dateStr(eventDate)}
      </p>
      {location && (
        <p className="text-base mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5a6e50" }}>
          {location}
        </p>
      )}
      <p className="text-sm leading-relaxed max-w-[75%] italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#7a8e6a" }}>
        {message}
      </p>
    </div>
  </div>
);

/* ─── 5. Sage Leaf ─── */
const SageLeaf = ({ title, eventDate, location, message }: TemplateProps) => (
  <div className="relative w-full" style={{ aspectRatio: "5/7" }}>
    <img src={sageLeafBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 flex flex-col items-center text-center px-12" style={{ paddingTop: "15%", paddingRight: "8%", paddingLeft: "30%" }}>
      <p className="text-xs uppercase tracking-[0.35em] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#7a8e78" }}>
        You're Invited
      </p>
      <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#4a5e48" }}>
        {title}
      </h2>
      <div className="w-14 h-px my-3" style={{ backgroundColor: "#8aa088" }} />
      <p className="text-base mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5a6e58" }}>
        {dateStr(eventDate)}
      </p>
      {location && (
        <p className="text-base mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#5a6e58" }}>
          {location}
        </p>
      )}
      <p className="text-sm leading-relaxed italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#7a8e78" }}>
        {message}
      </p>
    </div>
  </div>
);

/* ─── 6. Vintage Tulip ─── */
const VintageTulip = ({ title, eventDate, location, message }: TemplateProps) => (
  <div className="relative w-full" style={{ aspectRatio: "5/7" }}>
    <img src={vintageTulipBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 flex flex-col items-center text-center px-10" style={{ paddingTop: "12%", paddingBottom: "38%" }}>
      <p className="text-xs uppercase tracking-[0.35em] mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#8a6050" }}>
        Please Join Us For
      </p>
      <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#6b3a30" }}>
        {title}
      </h2>
      <div className="w-16 h-px my-3" style={{ backgroundColor: "#a07060" }} />
      <p className="text-base font-light mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#7a5040" }}>
        {dateStr(eventDate)}
      </p>
      {location && (
        <p className="text-base font-light mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#7a5040" }}>
          {location}
        </p>
      )}
      <p className="text-sm leading-relaxed max-w-[80%] italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#9a7868" }}>
        {message}
      </p>
    </div>
  </div>
);

export const templateConfigs = [
  { id: "baby-blocks", name: "Baby Blocks" },
  { id: "floral-wreath", name: "Floral Wreath" },
  { id: "blush-roses", name: "Blush Roses" },
  { id: "garden-peony", name: "Garden Peony" },
  { id: "sage-leaf", name: "Sage Leaf" },
  { id: "vintage-tulip", name: "Vintage Tulip" },
];

export const templates: Record<string, React.FC<TemplateProps>> = {
  "baby-blocks": BabyBlocks,
  "floral-wreath": FloralWreath,
  "blush-roses": BlushRoses,
  "garden-peony": GardenPeony,
  "sage-leaf": SageLeaf,
  "vintage-tulip": VintageTulip,
};
