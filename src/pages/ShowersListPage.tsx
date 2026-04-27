import { MobileLayout } from "@/components/layout/MobileLayout";
import { ShowerBlocksGrid } from "@/components/home/ShowerBlocksGrid";
import { SetupProgress } from "@/components/home/SetupProgress";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShowersListPage = () => {
  const navigate = useNavigate();
  return (
    <MobileLayout>
      <div className="px-6 pt-10 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
        <h1 className="text-2xl font-bold mb-1">Showers</h1>
        <p className="text-sm text-muted-foreground mb-5">All your showers in one place.</p>
      </div>

      <div className="px-6 pb-8 space-y-6">
        <SetupProgress />
        <ShowerBlocksGrid title="All Showers" />
      </div>
    </MobileLayout>
  );
};

export default ShowersListPage;
