import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

const AdminPage = () => {
  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-sm text-muted-foreground">Manage store items, vendors, and settings</p>
      </div>
      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { title: "Registry Items", desc: "Manage Bump City store items & local services", emoji: "🛍️" },
          { title: "Vendors", desc: "Add and edit vendor directory listings", emoji: "📋" },
          { title: "Community Events", desc: "Create and manage community events", emoji: "📅" },
          { title: "App Settings", desc: "Incentive values, reward amounts", emoji: "⚙️" },
        ].map((item) => (
          <Card key={item.title} className="border-none cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="text-2xl bg-muted w-12 h-12 rounded-xl flex items-center justify-center">{item.emoji}</div>
              <div>
                <h3 className="font-bold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="px-6 pb-6">
        <Badge variant="secondary" className="text-xs">🚧 Full admin CRUD coming with admin role setup</Badge>
      </div>
    </MobileLayout>
  );
};

export default AdminPage;
