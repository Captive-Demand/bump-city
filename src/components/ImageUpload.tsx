import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  currentUrl?: string | null;
  folder: string;
  onUploaded: (url: string) => void;
  className?: string;
  children?: React.ReactNode;
  overlayClassName?: string;
}

const ImageUpload = ({ currentUrl, folder, onUploaded, className, children, overlayClassName }: ImageUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
    onUploaded(urlData.publicUrl);
    setUploading(false);
    toast.success("Image uploaded!");
  };

  return (
    <div
      className={cn("relative cursor-pointer group", className)}
      onClick={() => fileRef.current?.click()}
    >
      {children}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full",
        uploading && "opacity-100",
        overlayClassName
      )}>
        {uploading ? (
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
        ) : (
          <Camera className="h-5 w-5 text-white" />
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
};

export default ImageUpload;
