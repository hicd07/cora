"use client";

import { useEffect, useState } from "react";
import { Save, Bot, KeyRound, Sparkles, Eye, EyeOff, Map as MapIcon, Info, ExternalLink } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminSettings, useUpdateSetting, AdminSetting } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";

const SettingField = ({
  setting,
  onSave,
  saving,
}: {
  setting: AdminSetting;
  onSave: (key: string, value: string) => void;
  saving: boolean;
}) => {
  const [value, setValue] = useState(setting.is_secret ? "" : setting.value ?? "");
  const [show, setShow] = useState(false);
  const dirty = setting.is_secret ? value.length > 0 : value !== (setting.value ?? "");

  useEffect(() => {
    if (!setting.is_secret) setValue(setting.value ?? "");
  }, [setting.value, setting.is_secret]);

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {setting.is_secret && <KeyRound className="h-3.5 w-3.5" />}
        {setting.description || setting.key}
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={setting.is_secret && !show ? "password" : "text"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              setting.is_secret
                ? setting.has_value
                  ? "•••••••• (configurada — escribe para reemplazar)"
                  : "Sin configurar"
                : "Ingresa el valor..."
            }
            className="field-soft"
          />
          {setting.is_secret && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          disabled={!dirty || saving}
          onClick={() => onSave(setting.key, value)}
          className="rounded-xl"
        >
          <Save className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const AdminSettings = () => {
  const { data: settings, isLoading } = useAdminSettings();
  const update = useUpdateSetting();

  const handleSave = async (key: string, value: string) => {
    try {
      await update.mutateAsync({ key, value });
      showSuccess("Configuración guardada correctamente.");
    } catch (e) {
      showError((e as Error).message);
    }
  };

  const provider = settings?.find((s) => s.key === "AI_PROVIDER")?.value || "openai";
  
  // Map settings
  const mapsPublicKey = settings?.find((s) => s.key === "GOOGLE_MAPS_API_KEY");
  const mapsSecretKey = settings?.find((s) => s.key === "GOOGLE_MAPS_SECRET_KEY");

  // AI settings
  const aiSecrets = (settings ?? []).filter((s) => ["OPENAI_API_KEY", "GOOGLE_API_KEY"].includes(s.key));
  const aiModels = (settings ?? []).filter((s) => ["OPENAI_MODEL", "GOOGLE_MODEL"].includes(s.key));
  
  // Filter others
  const excludedKeys = [
    "AI_PROVIDER", 
    "OPENAI_API_KEY", 
    "GOOGLE_API_KEY", 
    "OPENAI_MODEL", 
    "GOOGLE_MODEL", 
    "GOOGLE_MAPS_API_KEY",
    "GOOGLE_MAPS_SECRET_KEY"
  ];
  
  const otherSettings = (settings ?? []).filter((s) => !excludedKeys.includes(s.key));

  return (
    <AdminLayout title="Configuración del sistema">
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          {/* Google Maps Section */}
          <section className="rounded-3xl border border-border bg-background p-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
              <MapIcon size={120} />
            </div>
            
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <MapIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">Servicios de Mapas</h2>
                <p className="text-sm text-muted-foreground">
                  Configuración esencial para geolocalización y búsqueda de proveedores.
                </p>
              </div>
            </div>
            
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {mapsPublicKey && (
                    <SettingField setting={mapsPublicKey} onSave={handleSave} saving={update.isPending} />
                  )}
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20 text-[11px] leading-relaxed text-blue-700 dark:text-blue-300">
                    <div className="flex gap-2 mb-2">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-bold">USO DEL NAVEGADOR (CLIENTE)</span>
                    </div>
                    Esta llave se usa para renderizar el mapa en la app. **Debe estar restringida** en Google Cloud por "HTTP Referrer" para evitar robos de crédito.
                  </div>
                </div>

                <div className="space-y-4">
                  {mapsSecretKey && (
                    <SettingField setting={mapsSecretKey} onSave={handleSave} saving={update.isPending} />
                  )}
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                    <div className="flex gap-2 mb-2">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-bold">USO DEL SERVIDOR (BACKEND)</span>
                    </div>
                    Usada por las Edge Functions para buscar ferreterías cercanas. Se recomienda que esta llave sea distinta a la pública y restringida por "Dirección IP".
                  </div>
                </div>
              </div>

              <div className="mt-2 p-4 rounded-2xl bg-muted/30 border border-dashed border-border">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">APIs Requeridas en Google Cloud</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {["Maps JavaScript API", "Places API", "Geocoding API"].map((api) => (
                    <div key={api} className="flex items-center gap-2 text-xs font-medium bg-background border rounded-xl px-3 py-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {api}
                    </div>
                  ))}
                </div>
                <Button variant="link" className="h-auto p-0 mt-4 text-xs gap-1" asChild>
                  <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noreferrer">
                    Ir a la consola de Google Cloud <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </section>

          {/* AI Provider section */}
          <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">Motor de Inteligencia Artificial</h2>
                <p className="text-sm text-muted-foreground">
                  Controla qué IA procesa los mensajes entrantes de WhatsApp.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-8">
              {[
                { key: "openai", label: "OpenAI", desc: "GPT-4o mini · Estándar de la industria" },
                { key: "google", label: "Google Gemini", desc: "Gemini Flash · Óptimo para planes gratuitos" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSave("AI_PROVIDER", opt.key)}
                  className={`flex items-start gap-4 rounded-[1.5rem] border p-5 text-left transition-all ${
                    provider === opt.key
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-accent/5"
                  }`}
                >
                  <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${provider === opt.key ? "border-primary" : "border-muted-foreground/30"}`}>
                    {provider === opt.key && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-6 pt-6 border-t border-border/60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiModels.map((s) => (
                  <SettingField key={s.key} setting={s} onSave={handleSave} saving={update.isPending} />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiSecrets.map((s) => (
                  <SettingField key={s.key} setting={s} onSave={handleSave} saving={update.isPending} />
                ))}
              </div>
            </div>
          </section>

          {/* Other settings */}
          <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">Otras Configuraciones</h2>
                <p className="text-sm text-muted-foreground">Variables técnicas y ajustes adicionales del entorno.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherSettings.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-2 py-4 italic">No hay variables adicionales configuradas.</p>
              ) : (
                otherSettings.map((s) => (
                  <SettingField key={s.key} setting={s} onSave={handleSave} saving={update.isPending} />
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSettings;