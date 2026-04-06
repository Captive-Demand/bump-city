import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertCircle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface GuestImportDialogProps {
  eventId: string;
  userId: string;
  onImported: () => void;
}

interface ParsedGuest {
  name: string;
  email?: string;
  phone?: string;
}

const GuestImportDialog = ({ eventId, userId, onImported }: GuestImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedGuest[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setParsed([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const normalizeKey = (key: string): string => {
    const k = key.toLowerCase().trim();
    if (k === "name" || k === "guest name" || k === "full name" || k === "guest") return "name";
    if (k === "email" || k === "e-mail" || k === "email address") return "email";
    if (k === "phone" || k === "phone number" || k === "mobile" || k === "cell") return "phone";
    return k;
  };

  const parseRows = (rows: Record<string, unknown>[]): ParsedGuest[] => {
    return rows
      .map((row) => {
        const normalized: Record<string, string> = {};
        for (const [key, val] of Object.entries(row)) {
          normalized[normalizeKey(key)] = String(val ?? "").trim();
        }
        const name = normalized["name"];
        if (!name) return null;
        return { name, email: normalized["email"] || undefined, phone: normalized["phone"] || undefined };
      })
      .filter(Boolean) as ParsedGuest[];
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
      const guests = parseRows(rows);

      if (guests.length === 0) {
        toast.error("No guests found. Make sure your file has a 'Name' column.");
        reset();
        return;
      }
      setParsed(guests);
    } catch {
      toast.error("Could not read file. Please use a .csv or .xlsx file.");
      reset();
    }
  };

  const handleImport = async () => {
    if (parsed.length === 0) return;
    setImporting(true);

    const rows = parsed.map((g) => ({
      event_id: eventId,
      user_id: userId,
      name: g.name,
      email: g.email || null,
      phone: g.phone || null,
    }));

    const { error } = await supabase.from("guests").insert(rows);
    setImporting(false);

    if (error) {
      toast.error("Failed to import guests");
      return;
    }

    toast.success(`Imported ${parsed.length} guest${parsed.length > 1 ? "s" : ""}!`);
    reset();
    setOpen(false);
    onImported();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full h-8 gap-1">
          <Upload className="h-3.5 w-3.5" /> Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" /> Import Guests
          </DialogTitle>
        </DialogHeader>

        {parsed.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file with columns: <strong>Name</strong>, Email, Phone.
            </p>
            <div
              className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-primary/50 mb-2" />
              <p className="text-sm font-medium">Click to choose file</p>
              <p className="text-xs text-muted-foreground mt-1">CSV or Excel</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground">— {parsed.length} guest{parsed.length > 1 ? "s" : ""} found</span>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
              {parsed.slice(0, 50).map((g, i) => (
                <div key={i} className="px-3 py-2 text-sm flex items-center justify-between">
                  <span className="font-medium truncate">{g.name}</span>
                  <span className="text-xs text-muted-foreground truncate ml-2">{g.email || ""}</span>
                </div>
              ))}
              {parsed.length > 50 && (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                  +{parsed.length - 50} more
                </div>
              )}
            </div>

            {parsed.some((g) => !g.email) && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Some guests don't have email addresses. They'll still be added but can't receive email invites.</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>Cancel</Button>
              <Button className="flex-1" onClick={handleImport} disabled={importing}>
                {importing ? "Importing..." : `Import ${parsed.length} Guest${parsed.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GuestImportDialog;
