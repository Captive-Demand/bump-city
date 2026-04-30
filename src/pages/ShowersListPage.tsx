import { MobileLayout } from "@/components/layout/MobileLayout";
import { ShowerBlocksGrid } from "@/components/home/ShowerBlocksGrid";
import { SetupProgress } from "@/components/home/SetupProgress";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActiveEvent } from "@/contexts/ActiveEventContext";

const ShowersListPage = () => {
  const navigate = useNavigate();
  const { allEvents } = useActiveEvent();

  // When the user only has one shower, the "All Showers" wrapper + "See all"
  // link are redundant — both point at this same page. Just show the card
  // and the create-new affordance.
  const single = allEvents.length <= 1;

  return (
    <MobileLayout>
      <div className="px-6 pt-10 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
        <h1 className="text-2xl font-bold mb-1">{single ? "Your Shower" : "Showers"}</h1>
        <p className="text-sm text-muted-foreground mb-5">
          {single ? "Open your shower or start a new one." : "All your showers in one place."}
        </p>
      </div>

      <div className="px-6 pb-8 space-y-6">
        <SetupProgress />
        <ShowerBlocksGrid title={single ? "" : "All Showers"} showSeeAll={false} />
      </div>
    </MobileLayout>
  );
};

export default ShowersListPage;
