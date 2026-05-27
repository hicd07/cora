"use client";

import React, { useCallback, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionContext } from "@/components/auth/SessionContext";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/utils/toast";

interface CoverImagePickerProps {
  currentUrl?: string | null;
  onUploadComplete: (url: string | null) => void;
}

export const CoverImagePicker: React.FC<CoverImagePickerProps> = ({ currentUrl, onUploadComplete }) => {
  const { user } = useSessionContext();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validation: Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      showError("La imagen es demasiado pesada (máx 5MB)");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/cover-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("store-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("store-assets").getPublicUrl(filePath);
      
      onUploadComplete(data.publicUrl);
      showSuccess("Foto de portada cargada correctamente");
    } catch (error) {
      console.error("Error uploading cover:", error);
      showError("No se pudo subir la imagen");
    } finally {
      setIsUploading(false);
    }
  }, [user, onUploadComplete]);

  const removeImage = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUploadComplete(null);
  }, [onUploadComplete]);

  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] border border-dashed border-border bg-[hsl(var(--surface-1))] transition-all hover:border-primary/30">
      <div className="aspect-[16/6] w-full sm:aspect-[16/5]">
        {currentUrl ? (
          <div className="relative h-full w-full">
            <img 
              src={currentUrl} 
              alt="Portada de ferretería" 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
            
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={removeImage}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/90 text-destructive-foreground shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/90 text-primary shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-95">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center transition-colors hover:bg-[hsl(var(--surface-2))]">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ImagePlus className="h-6 w-6" />
              </div>
            )}
            <div>
              <p className="font-display text-sm font-semibold text-foreground">Subir foto de portada</p>
              <p className="mt-1 text-xs text-muted-foreground">Formato panorámico 16:9 recomendado</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
          </label>
        )}
      </div>
    </div>
  );
};

export default CoverImagePicker;