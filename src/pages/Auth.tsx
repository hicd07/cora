import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, FileText, HardHat, Lock, LogIn, Mail, Moon, ShieldCheck, Store, SunMedium, Truck, User, UserPlus } from "lucide-react";
import { useSessionContext } from "@/components/auth/SessionContext";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { dismissToast, showError, showLoading, showSuccess } from "@/utils/toast";

const featureHighlights = [
  {
    title: "Comparación por ítem",
    description: "Evalúa precios, disponibilidad y entrega desde una sola vista.",
    icon: HardHat,
  },
  {
    title: "Proveedores verificados",
    description: "Trabaja con ferreterías activas en Santo Domingo Este.",
    icon: ShieldCheck,
  },
  {
    title: "Despachos por zona",
    description: "Organiza compras y cobertura comercial con claridad.",
    icon: Truck,
  },
];

export const Auth: React.FC = () => {
  const { session, profile, refreshProfile, updateProfile, loading: sessionLoading } = useSessionContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [userType, setUserType] = useState<"engineer" | "hardware" | null>(null);

  useEffect(() => {
    if (sessionLoading) return;

    if (session && profile) {
      if (profile.onboarded) {
        navigate("/", { replace: true });
      } else {
        setIsOnboarding(true);
      }
    }
  }, [session, profile, sessionLoading, navigate]);

  useEffect(() => {
    if (profile && !profile.onboarded) {
      setFullName(profile.full_name || profile.store_name || "");
      setDocumentId(profile.document_id || "");
      setUserType(profile.user_type || null);
    }
  }, [profile]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showError("Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);
    const toastId = showLoading(isSignUp ? "Creando cuenta..." : "Iniciando sesión...");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });

        dismissToast(toastId);
        if (error) {
          showError(error.message);
          return;
        }

        if (data.user) {
          showSuccess("¡Cuenta creada con éxito! Completemos tu perfil.");
          setIsOnboarding(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        dismissToast(toastId);
        if (error) {
          showError(error.message);
          return;
        }

        showSuccess("¡Bienvenido de vuelta!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !documentId || !userType) {
      showError("Por favor, completa todos los campos de registro.");
      return;
    }

    setLoading(true);
    const toastId = showLoading("Guardando tu perfil...");

    try {
      const user = (await supabase.auth.getUser()).data.user;

      if (!user) {
        throw new Error("No se encontró un usuario activo.");
      }

      await updateProfile({
        id: user.id,
        full_name: fullName,
        document_id: documentId,
        user_type: userType,
        onboarded: true,
        store_name: userType === "hardware" ? fullName : null,
        sector: userType === "hardware" ? "Alma Rosa I" : null,
        delivery_coverage: userType === "hardware" ? ["Alma Rosa I", "Alma Rosa II"] : [],
        is_public: userType === "hardware",
        rating: userType === "hardware" ? 5 : 0,
        reviews_count: 0,
      });

      await refreshProfile();
      dismissToast(toastId);
      showSuccess("¡Perfil configurado con éxito!");
      navigate("/", { replace: true });
    } catch (err: any) {
      dismissToast(toastId);
      showError(err.message || "Error al guardar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-0))] px-4 py-5 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl flex-col gap-4 md:min-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">Acceso seguro</p>
            <h1 className="font-display text-xl font-semibold text-foreground">PIDO</h1>
          </div>
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid flex-1 gap-4 md:grid-cols-[1.05fr_0.95fr]">
          <section className="app-shell relative overflow-hidden p-6 md:p-8">
            <div className="panel-strong absolute inset-x-6 top-6 h-28 rounded-[2rem] border-primary/15 bg-[hsl(var(--primary)/0.08)] blur-2xl md:inset-x-8" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-6">
              <div>
                <span className="data-chip data-chip-accent">Marketplace B2B · SDE</span>
                <h2 className="font-display mt-4 max-w-sm text-3xl font-semibold leading-tight text-foreground md:text-4xl">
                  {isOnboarding ? "Tu operación empieza con un perfil claro." : isSignUp ? "Crea una cuenta y publica más rápido." : "Vuelve a tu panel de compras y ofertas."}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                  Plataforma diseñada para subastas, abastecimiento y coordinación comercial entre ingenieros y ferreterías.
                </p>
              </div>

              <div className="grid gap-3">
                {featureHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.title} className="panel-muted flex items-start gap-3 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-[hsl(var(--primary)/0.14)] text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground md:text-sm">{item.description}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="app-shell overflow-hidden md:self-center">
            <div className="border-b border-border bg-[hsl(var(--primary)/0.1)] px-6 py-6 md:px-7 md:py-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-label">{isOnboarding ? "Paso 2 · Configuración" : isSignUp ? "Nuevo acceso" : "Inicio de sesión"}</p>
                  <h2 className="font-display mt-2 text-2xl font-semibold text-foreground">
                    {isOnboarding ? "Completa tu perfil" : isSignUp ? "Crea tu cuenta" : "Inicia sesión"}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {isOnboarding
                      ? "Necesitamos tus datos básicos para dejar lista tu operación dentro de PIDO."
                      : "Accede a tu espacio de compras, cotizaciones y relaciones comerciales."}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] border border-primary/20 bg-primary text-primary-foreground shadow-[0_18px_32px_-24px_hsl(var(--primary)/0.8)]">
                  <HardHat className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6 md:px-7 md:py-7">
              {!isOnboarding ? (
                <form onSubmit={handleAuth} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="section-label block">Correo electrónico</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        placeholder="ejemplo@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="section-label block">Contraseña</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full justify-center">
                    {loading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : isSignUp ? (
                      <>
                        <UserPlus className="h-4 w-4" />Registrarse
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" />Ingresar
                      </>
                    )}
                  </Button>

                  <div className="panel-muted p-4">
                    <p className="section-label">Beneficio</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      Publica pedidos, compara ofertas por ítem y coordina con proveedores verificados desde una sola interfaz.
                    </p>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="font-display rounded-full px-3 py-1 text-sm font-semibold text-primary transition-[transform,opacity] duration-200 hover:-translate-y-0.5 hover:opacity-85"
                    >
                      {isSignUp ? "¿Ya tienes una cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleOnboardingSubmit} className="space-y-5">
                  <div>
                    <span className="data-chip data-chip-accent">Paso 2 · Configuración</span>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Configura tu identidad comercial o profesional para empezar con la experiencia completa.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="section-label block">Nombre o razón social</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        required
                        placeholder="Ej: Ing. Juan Pérez / Ferretería El Sol"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="section-label block">RNC o cédula</label>
                    <div className="relative">
                      <FileText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        required
                        placeholder="Ej: 131-XXXXX-X"
                        value={documentId}
                        onChange={(e) => setDocumentId(e.target.value)}
                        className="pl-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="section-label block">Tipo de perfil</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "engineer", title: "Soy Ingeniero", description: "Quiero publicar pedidos y comparar ofertas.", icon: HardHat },
                        { id: "hardware", title: "Soy Ferretería", description: "Quiero vender y enviar cotizaciones.", icon: Store },
                      ].map((option) => {
                        const Icon = option.icon;
                        const isSelected = userType === option.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setUserType(option.id as "engineer" | "hardware")}
                            className={cn(
                              "interactive-card flex min-h-[152px] flex-col justify-between rounded-[1.5rem] border p-4 text-left",
                              isSelected
                                ? "border-primary/25 bg-[hsl(var(--primary)/0.12)] shadow-[0_18px_30px_-28px_hsl(var(--primary)/0.7)]"
                                : "border-border bg-card hover:bg-[hsl(var(--surface-2))]",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div
                                className={cn(
                                  "flex h-11 w-11 items-center justify-center rounded-[1.1rem]",
                                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              {isSelected && (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_20px_-16px_hsl(var(--primary)/0.8)]">
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-display text-sm font-semibold text-foreground">{option.title}</p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{option.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button type="submit" disabled={loading || !userType} className="w-full justify-center">
                    {loading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <>
                        Completar registro
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Auth;
