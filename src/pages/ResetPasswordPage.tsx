import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Baby, Lock } from "lucide-react";
import { toast } from "sonner";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/");
    }
  };

  if (!isRecovery) {
    return (
      <MobileLayout hideNav>
        <div className="px-6 pt-16 pb-8 flex flex-col items-center min-h-screen max-w-[500px] mx-auto w-full">
          <Baby className="h-10 w-10 text-primary mb-3" />
          <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
          <p className="text-sm text-muted-foreground mb-4">This reset link is invalid or has expired.</p>
          <Button onClick={() => navigate("/auth")}>Back to Login</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideNav>
      <div className="px-6 pt-16 pb-8 flex flex-col items-center min-h-screen max-w-[500px] mx-auto w-full">
        <Baby className="h-10 w-10 text-primary mb-3" />
        <h1 className="text-2xl font-bold mb-1">Set New Password</h1>
        <p className="text-sm text-muted-foreground mb-8">Enter your new password below</p>
        <Card className="w-full border-none">
          <CardContent className="p-6">
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required minLength={6} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default ResetPasswordPage;
