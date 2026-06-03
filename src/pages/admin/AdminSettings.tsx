"use client";

import { useEffect, useState, useMemo } from "react";
import { Save, Bot, KeyRound, Eye, EyeOff, Map as MapIcon, ShieldCheck, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminSettings, useUpdateSetting, AdminSetting } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";

const DEFAULT_MAP_SETTINGS: Partial<AdminSetting>[] = [
  { key: "GOOGLE_MAPS_API_KEY", description: "Google Maps API Key", is_secret: true },
];

const DEFAULT_AI_SETTINGS: Partial<AdminSetting>[] = [
  { key: "AI_PROVIDER", description: "Proveedor de IA activo", is_secret: false },
  { key: "OPENAI_API_KEY", description: "OpenAI API Key", is_secret: true },
  { key: "OPENAI_MODEL", description: "Modelo de OpenAI", is_secret: false },
  { key: "GOOGLE_API_KEY", description: "Google Gemini API Key", is_secret: true },
  { key: "GOOGLE_MODEL", description: "Modelo de Gemini", is_secret: false },
];

const SettingField = ({
  setting,
  onSave,
  onClear,
  saving,
}: {
  setting: AdminSetting;
  onSave: (key: string, value: string) => void;
  onClear: (key: string) => void;
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
                  ? "Configurada (reemplazar...)"
                  : "Sin configurar"
                : "Valor..."
            }
            className="field-soft pr-12"
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
          className="rounded-xl shrink-0"
        >
          <Save className="h-4 w-4" />
        </Button>
        {setting.has_value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClear(setting.key)}
            className="rounded-xl text-destructive hover:bg-destructive/10 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const AdminSettings = () => {
  const { data: settings = [], isLoading } = useAdminSettings();
  const update = useUpdateSetting();

  const mergedSettings = useMemo(() => {
    const allTemplates = [...DEFAULT_MAP_SETTINGS, ...DEFAULT_AI_SETTINGS];
    const results = [...settings];

    allTemplates.forEach(template => {
      const exists = results.find(s => s.key === template.key);
      if (!exists) {
        results.push({
          key: template.key!,
          value: null,
          is_secret: template.is_secret!,
          description: template.description!,
          has_value: false,
        } as AdminSetting);
      }
    });

    // Filtramos para evitar mostrar llaves legacy duplicadas como GOOGLE_MAPS_SECRET_KEY
    return results.filter(s => s.key !== "GOOGLE_MAPS_SECRET_KEY");
  }, [settings]);

  const handleSave = async (key: string, value: string) => {
    try {
      await update.mutateAsync({ key, value });
      showSuccess(`Configuración "${key}" guardada.`);
    } catch (e) {
      showError((e as Error).message);
    }
  };

  const handleClear = async (key: string) => {
    try {
      await update.mutateAsync({ key, value: "" });
      showSuccess(`Configuración "${key}" eliminada.`);
    } catch (e) {
      showError((e as Error).message);
    }
  };

  const provider = mergedSettings.find((s) => s.key === "AI_PROVIDER")?.value || "openai";
  
  const mapSettings = mergedSettings.filter(s => s.key === "GOOGLE_MAPS_API_KEY");
  const aiSecrets = mergedSettings.filter(s => ["OPENAI_API_KEY", "GOOGLE_API_KEY"].includes(s.key));
  const aiModels = mergedSettings.filter(s => ["OPENAI_MODEL", "GOOGLE_MODEL"].includes(s.key));
  
  const excludedKeys = [
    "AI_PROVIDER",
    "OPENAI_API_KEY",
    "GOOGLE_API_KEY",
    "OPENAI_MODEL",
    "GOOGLE_MODEL",
    "GOOGLE_MAPS_API_KEY",
    "GOOGLE_MAPS_SECRET_KEY"
  ];
  
  const otherSettings = mergedSettings.filter((s) => !excludedKeys.includes(s.key));

  return (
    <AdminLayout title="Configuración del sistema">
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          <section className="rounded-3xl border border-border bg-background p-6 shadow-sm overflow-hidden relative">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <MapIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">Servicios de Mapas</h2>
                <p className="text-sm text-muted-foreground">Configura la API Key única para geolocalización.</p>
              </div>
            </div>
            
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mapSettings.map(setting => (
                  <div key={setting.key} className="space-y-4">
                    <SettingField setting={setting} onSave={handleSave} onClear={handleClear} saving={update.isPending} />
                    <div className="p-4 rounded-2xl border text-[11px] leading-relaxed bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20 text-amber-700 dark:text-amber-300">
                      <div className="flex gap-2 mb-2">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-bold uppercase">Seguridad</span>
                      </div>
                      Usa la API Key de Google Cloud Console. Asegúrate de tener activos: Places API, Maps JavaScript API y Geocoding API.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">Inteligencia Artificial</h2>
                <p className="text-sm text-muted-foreground">Procesamiento de mensajes de WhatsApp.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-8">
              {[
                { key: "openai", label: "OpenAI", desc: "GPT-4o mini" },
                { key: "google", label: "Google Gemini", desc: "Gemini 1.5 Flash" },
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
                  <SettingField key={s.key} setting={s} onSave={handleSave} onClear={handleClear} saving={update.isPending} />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiSecrets.map((s) => (
                  <SettingField key={s.key} setting={s} onSave={handleSave} onClear={handleClear} saving={update.isPending} />
                ))}
              </div>
            </div>
          </section>

          {otherSettings.length > 0 && (
            <section className="rounded-3xl border border-border bg-background p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold mb-6">Otros Ajustes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherSettings.map((s) => (
                  <SettingField key={s.key} setting={s} onSave={handleSave} onClear={handleClear} saving={update.isPending} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSettings;