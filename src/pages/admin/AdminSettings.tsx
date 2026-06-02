"use client";

import { useEffect, useState } from "react";
import { Save, Bot, KeyRound, Sparkles, Eye, EyeOff, Map as MapIcon } from "lucide-react";
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
      <Label className="flex items-center gap-2">
        {setting.is_secret && <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />}
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
                : ""
            }
          />
          {setting.is_secret && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
      showSuccess("Configuración guardada.");
    } catch (e) {
      showError((e as Error).message);
    }
  };

  const provider = settings?.find((s) => s.key === "AI_PROVIDER")?.value || "openai";
  const mapsKey = settings?.find((s) => s.key === "GOOGLE_MAPS_API_KEY");

  const aiSecrets = (settings ?? []).filter((s) => ["OPENAI_API_KEY", "GOOGLE_API_KEY"].includes(s.key));
  const aiModels = (settings ?? []).filter((s) => ["OPENAI_MODEL", "GOOGLE_MODEL"].includes(s.key));
  const otherSettings = (settings ?? []).filter(
    (s) => !["AI_PROVIDER", "OPENAI_API_KEY", "GOOGLE_API_KEY", "OPENAI_MODEL", "GOOGLE_MODEL", "GOOGLE_MAPS_API_KEY"].includes(s.key),
  );

  return (
    <AdminLayout title="Configuración del sistema">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Google Maps Section */}
          <section className="rounded-2xl border border-border bg-background p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <MapIcon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold">Servicios de Mapas</h2>
                <p className="text-xs text-muted-foreground">
                  Configura la API Key necesaria para la geolocalización y visualización.
                </p>
              </div>
            </div>
            
            {mapsKey && (
              <div className="space-y-4">
                <SettingField setting={mapsKey} onSave={handleSave} saving={update.isPending} />
                <p className="text-[11px] text-muted-foreground bg-blue-50/50 p-2 rounded-lg border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30">
                  <strong>Importante:</strong> Esta llave es pública y visible para todos los usuarios autenticados para que el navegador pueda cargar los mapas. Asegúrate de restringirla en la consola de Google Cloud por HTTP Referrer.
                </p>
              </div>
            )}
          </section>

          {/* AI Provider selection */}
          <section className="rounded-2xl border border-border bg-background p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold">Proveedor de IA</h2>
                <p className="text-xs text-muted-foreground">
                  Motor usado para estructurar mensajes de WhatsApp.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { key: "openai", label: "OpenAI", desc: "GPT-4o mini · de pago" },
                { key: "google", label: "Google Gemini", desc: "Gemini Flash · plan gratuito" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSave("AI_PROVIDER", opt.key)}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                    provider === opt.key
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Sparkles
                    className={`mt-0.5 h-5 w-5 ${
                      provider === opt.key ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4 border-t border-border pt-5">
              {aiModels.map((s) => (
                <SettingField key={s.key} setting={s} onSave={handleSave} saving={update.isPending} />
              ))}
              {aiSecrets.map((s) => (
                <SettingField key={s.key} setting={s} onSave={handleSave} saving={update.isPending} />
              ))}
            </div>
          </section>

          {/* Other env variables */}
          <section className="rounded-2xl border border-border bg-background p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="h-4 w-4" />
              </div>
              <h2 className="font-display text-base font-semibold">Variables de entorno</h2>
            </div>
            <div className="space-y-4">
              {otherSettings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay variables adicionales configuradas.</p>
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