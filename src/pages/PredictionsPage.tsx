import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Users } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";

interface Game {
  id: number;
  name: string;
  description: string;
  duration: string;
  players: string;
  emoji: string;
  status: "ready" | "in-progress" | "completed";
}

const games: Game[] = [
  {
    id: 1,
    name: "Baby Bingo",
    description: "Guests fill in bingo cards with gifts they think will be opened. First to get a line wins!",
    duration: "30 min",
    players: "Everyone",
    emoji: "🎯",
    status: "ready",
  },
  {
    id: 2,
    name: "Guess the Baby Food",
    description: "Blindfolded taste test of different baby foods. Most correct guesses wins!",
    duration: "15 min",
    players: "6-10",
    emoji: "🍼",
    status: "ready",
  },
  {
    id: 3,
    name: "Name That Tune (Lullaby Edition)",
    description: "Play snippets of lullabies. First to name the song gets a point!",
    duration: "20 min",
    players: "Everyone",
    emoji: "🎵",
    status: "ready",
  },
  {
    id: 4,
    name: "Baby Photo Match",
    description: "Match baby photos of guests to their adult selves. Hilarious and heartwarming!",
    duration: "15 min",
    players: "Everyone",
    emoji: "📸",
    status: "ready",
  },
  {
    id: 5,
    name: "Diaper Relay Race",
    description: "Teams race to diaper a baby doll as fast as possible. Fastest team wins!",
    duration: "10 min",
    players: "Teams of 2",
    emoji: "🏃",
    status: "ready",
  },
];

const statusColors = {
  ready: "bg-mint text-mint-foreground",
  "in-progress": "bg-warm text-warm-foreground",
  completed: "bg-lavender text-lavender-foreground",
};

const PredictionsPage = () => {
  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Prediction Portal</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {games.length} predictions & activities ready ✨
        </p>
      </div>

      <div className="px-6 space-y-3 pb-6">
        {games.map((game) => (
          <Card key={game.id} className="border-none overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl bg-muted w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
                    {game.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm">{game.name}</h3>
                      <Badge className={`${statusColors[game.status]} text-[10px] border-none`}>
                        {game.status === "ready" ? "Ready" : game.status === "in-progress" ? "Playing" : "Done"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {game.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px]">{game.duration}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span className="text-[10px]">{game.players}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MobileLayout>
  );
};

export default PredictionsPage;
