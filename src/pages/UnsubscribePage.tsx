import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
        const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        setStatus(data.valid === false && data.reason === "already_unsubscribed" ? "already" : "valid");
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      setStatus(data?.success ? "success" : "error");
    } catch { setStatus("error"); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center space-y-4">
          {status === "loading" && <p className="text-muted-foreground">Verifying…</p>}
          {status === "valid" && (
            <>
              <h1 className="text-xl font-bold">Unsubscribe</h1>
              <p className="text-muted-foreground">Click below to unsubscribe from future emails.</p>
              <Button onClick={handleUnsubscribe} disabled={submitting} className="w-full">
                {submitting ? "Processing…" : "Confirm Unsubscribe"}
              </Button>
            </>
          )}
          {status === "already" && <p className="text-muted-foreground">You're already unsubscribed.</p>}
          {status === "success" && <p className="text-green-600 font-medium">You've been unsubscribed successfully.</p>}
          {status === "invalid" && <p className="text-destructive">Invalid or expired unsubscribe link.</p>}
          {status === "error" && <p className="text-destructive">Something went wrong. Please try again later.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnsubscribePage;
