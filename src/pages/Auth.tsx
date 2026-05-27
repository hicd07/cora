import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  HardHat,
  Lock,
  LogIn,
  Mail,
  Moon,
  ShieldCheck,
  Sparkles,
  Store,
  SunMedium,
  Truck,
  User,
  UserPlus,
} from "lucide-react";
import AppLogo from "@/components/branding/AppLogo";
import { useSessionContext } from "@/components/auth/SessionContext";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { dismissToast, showError, showLoading, showSuccess } from "@/utils/toast";

const TITLE = "¡Conoce PIDO!";

const journeySteps = [
  {
    id: "compare",
    label: "Pagina 1",
    navLabel: "Comparacion",
    title: TITLE,
    heading: "Comparacion por item",
    description: "Evalúa precios, disponibilidad y entrega desde una sola vista.",
    icon: HardHat,
    accent: "Centraliza solicitudes y decisiones sin saltar entre chats, llamadas o hojas sueltas.",
  },
  {
    id: "providers",
    label: "Pagina 2",
    navLabel: "Proveedores",
    title: TITLE,
    heading: "Proveedores verificados",
    description: "Trabaja con ferreterías activas en Santo Domingo Este.",
    icon: ShieldCheck,
    accent: "Encuentra oferta real de negocios activos y acelera la validación comercial.",
  },
  {
    id: "dispatch",
    label: "Pagina 3",
    navLabel: "Despachos",
    title: TITLE,
    heading: "Despachos por zona",
    description: "Organiza compras y cobertura comercial con claridad.",
    icon: Truck,
    accent: "Visualiza cobertura y logística antes de cerrar la compra para reducir fricción.",
  },
  {
    id: "access",
    label: "Acceso",
    navLabel: "Login",
    title: TITLE,
    heading: "Accede a tu cuenta",
    description: "Entra cuando quieras o crea tu acceso para seguir en PIDO.",
    icon: LogIn,
    accent: "El acceso está disponible en cualquier momento durante el recorrido.",
  },
  {
    id: "profile",
    label: "Perfil",
    navLabel: "Perfil",
    title: TITLE,
    heading: "Completa tu perfil",
    description: "Define tu tipo de operación para activar tu experiencia dentro de PIDO.",
    icon: User,
    accent: "Este es el último paso para entrar con todo listo a tu panel.",
  },
] as const;

type StageKey = (typeof journeySteps)[number]["id"];
type AuthMode = "login" | "signup";

const featureNotes = [
  "Comparación centralizada por item",
  "Ferreterías activas en Santo Domingo Este",
  "Cobertura comercial y entregas más claras",
] as const;

export const Auth: React.FC = () => {
  const { session, profile, refreshProfile, updateProfile, loading: sessionLoading } = useSessionContext();
  const { theme, toggleTheme } = useTheme();

  const [activeStage, setActiveStage] = useState<StageKey>("compare");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [userType, setUserType] = useState<"engineer" | "hardware" | null>(null);

  const canAccessProfileStep = Boolean(session && profile && !profile.onboarded);

  useEffect(() => {
    if (sessionLoading) return;

    if (session && profile) {
      if (profile.onboarded) {
        return;
      }

      setFullName(profile.full_name || profile.store_name || "");
      setDocumentId(profile.document_id || "");
      setUserType(profile.user_type || null);
      setActiveStage("profile");
    }
  }, [profile, session, sessionLoading]);

  const visibleSteps = useMemo(
    () => (canAccessProfileStep || activeStage === "profile" ? journeySteps : journeySteps.filter((step) => step.id !== "profile")),
    [activeStage, canAccessProfileStep],
  );

  const activeStepIndex = visibleSteps.findIndex((step) => step.id === activeStage);
  const activeStep = visibleSteps[activeStepIndex] ?? visibleSteps[0];
  const ActiveIcon = activeStep.icon;

  const openLogin = () => {
    setAuthMode("login");
    setActiveStage("access");
  };

  const openSignup = () => {
    setAuthMode("signup");
    setActiveStage("access");
  };

  const handleStageSelection = (stage: StageKey) => {
    if (stage === "profile" && !canAccessProfileStep) return;
    setActiveStage(stage);
  };

  const goToNextStage = () => {
    const nextStep = visibleSteps[activeStepIndex + 1];
    if (nextStep) {
      setActiveStage(nextStep.id);
    }
  };

  const goToPreviousStage = () => {
    const previousStep = visibleSteps[activeStepIndex - 1];
    if (previousStep) {
      setActiveStage(previousStep.id);
    }
  };

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      showError("Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);
    const toastId = showLoading(authMode === "signup" ? "Creando cuenta..." : "Iniciando sesión...");

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        dismissToast(toastId);

        if (error) {
          showError(error.message);
          return;
        }

        if (data.user) {
          showSuccess("Cuenta creada. Ahora completa tu perfil.");
          setActiveStage("profile");
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

  const handleOnboardingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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
        full_name: fullName.trim(),
        document_id: documentId.trim(),
        user_type: userType,
        onboarded: true,
        store_name: userType === "hardware" ? fullName.trim() : null,
        sector: null,
        delivery_coverage: [],
        is_public: false,
        rating: 0,
        reviews_count: 0,
      });

      await refreshProfile();
      dismissToast(toastId);
      showSuccess("Perfil configurado con éxito.");
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || "Error al guardar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  const infoTag = activeStage === "access" ? (authMode === "signup" ? "Registro guiado" : "Login directo") : activeStep.label;

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-0))] px-4 py-5 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col gap-4 md:min-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.3rem] border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1))] shadow-[0_18px_30px_-24px_hsl(var(--foreground)/0.32)]">
              <div className="absolute inset-[4px] rounded-[1rem] bg-[hsl(var(--primary)/0.08)]" />
              <AppLogo variant="symbol" context="header" size={26} className="relative" />
            </div>
            <div>
              <p className="section-label">Acceso y onboarding</p>
              <h1 className="font-display text-2xl font-semibold text-foreground md:text-[30px]">PIDO</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={openLogin} className="rounded-full px-4">
              <LogIn className="h-4 w-4" />
              Ir al login
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
              {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <section className="app-shell flex-1 overflow-hidden p-4 md:p-6">
          <div className="panel-muted mb-5 overflow-x-auto px-3 py-4 md:px-5">
            <div className="flex min-w-max items-center gap-2 md:gap-3">
              {visibleSteps.map((step, index) => {
                const isActive = step.id === activeStage;
                const isCompleted = index < activeStepIndex;
                const isLocked = step.id === "profile" && !canAccessProfileStep;

                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() => handleStageSelection(step.id)}
                      disabled={isLocked}
                      className={cn(
                        "flex min-w-[116px] items-center gap-3 rounded-full border px-3 py-2.5 text-left transition-all duration-200 md:min-w-[142px] md:px-4",
                        isActive
                          ? "border-primary/30 bg-primary text-primary-foreground shadow-[0_20px_30px_-24px_hsl(var(--primary)/0.8)]"
                          : "border-border bg-[hsl(var(--surface-1))] text-foreground",
                        isLocked && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          isActive
                            ? "border-white/25 bg-white/15 text-white"
                            : isCompleted
                              ? "border-primary/20 bg-[hsl(var(--primary)/0.14)] text-primary"
                              : "border-[hsl(var(--foreground)/0.1)] bg-[hsl(var(--surface-2))] text-muted-foreground",
                        )}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className={cn("font-display text-sm font-semibold", !isActive && "text-foreground")}>{step.navLabel}</p>
                        <p className={cn("text-[11px] leading-tight", isActive ? "text-white/80" : "text-muted-foreground")}>{step.label}</p>
                      </div>
                    </button>

                    {index < visibleSteps.length - 1 ? <div className="h-px w-10 shrink-0 bg-border md:w-14" /> : null}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
            <div className="panel-strong relative overflow-hidden p-6 md:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_34%),radial-gradient(circle_at_bottom_right,hsl(var(--accent-foreground)/0.08),transparent_34%)]" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="data-chip data-chip-accent">
                      <Sparkles className="h-3.5 w-3.5" />
                      {infoTag}
                    </span>
                    <span className="data-chip">Paso {activeStepIndex + 1} de {visibleSteps.length}</span>
                  </div>

                  <h2 className="font-display mt-6 text-3xl font-semibold leading-tight text-foreground md:text-5xl">{activeStep.title}</h2>
                  <p className="mt-4 max-w-xl text-lg font-semibold text-foreground md:text-2xl">{activeStep.heading}</p>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">{activeStep.description}</p>
                </div>

                <div className="grid gap-3">
                  <article className="panel-muted p-4 md:p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-[hsl(var(--primary)/0.14)] text-primary">
                        <ActiveIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="section-label">Detalle</p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground">{activeStep.accent}</p>
                      </div>
                    </div>
                  </article>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {featureNotes.map((note) => (
                      <div key={note} className="rounded-[1.35rem] border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1)/0.9)] p-4 shadow-[0_16px_26px_-24px_hsl(var(--foreground)/0.4)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">PIDO</p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="app-shell overflow-hidden">
              <div className="border-b border-border bg-[hsl(var(--primary)/0.08)] px-6 py-5 md:px-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="section-label">{activeStep.label}</p>
                    <h3 className="font-display mt-2 text-2xl font-semibold text-foreground">{TITLE}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {activeStage === "access"
                        ? "Elige cómo quieres entrar y completa tus credenciales desde aquí."
                        : activeStage === "profile"
                          ? "Termina tu configuración para pasar al panel principal."
                          : "Explora cada ventaja con un stepper horizontal y avanza a tu ritmo."}
                    </p>
                  </div>

                  <Button type="button" variant="ghost" onClick={openLogin} className="rounded-full text-primary hover:bg-[hsl(var(--primary)/0.1)] hover:text-primary">
                    <LogIn className="h-4 w-4" />
                    Login
                  </Button>
                </div>
              </div>

              <div className="space-y-6 px-6 py-6 md:px-7 md:py-7">
                {activeStage === "compare" || activeStage === "providers" || activeStage === "dispatch" ? (
                  <div className="space-y-5">
                    <div className="panel-muted p-5">
                      <p className="section-label">Resumen</p>
                      <h4 className="font-display mt-3 text-xl font-semibold text-foreground">{activeStep.heading}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{activeStep.description}</p>
                    </div>

                    <div className="grid gap-3">
                      <Button type="button" onClick={goToNextStage} className="w-full justify-center rounded-full">
                        {activeStage === "dispatch" ? "Continuar al acceso" : "Siguiente"}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" onClick={openLogin} className="w-full justify-center rounded-full">
                        <LogIn className="h-4 w-4" />
                        Ir al login
                      </Button>
                    </div>
                  </div>
                ) : null}

                {activeStage === "access" ? (
                  <form onSubmit={handleAuth} className="space-y-5">
                    <div className="panel-muted p-4">
                      <p className="section-label">Acceso</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground">
                        {authMode === "signup"
                          ? "Registrate ahora para continuar al último paso y completar tu perfil."
                          : "Inicia sesion para entrar directo a tu experiencia dentro de PIDO."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setAuthMode("signup")}
                        className={cn(
                          "rounded-[1.4rem] border px-4 py-4 text-left transition-all duration-200",
                          authMode === "signup"
                            ? "border-primary/30 bg-[hsl(var(--primary)/0.12)] text-foreground shadow-[0_18px_28px_-24px_hsl(var(--primary)/0.8)]"
                            : "border-border bg-[hsl(var(--surface-2))] text-muted-foreground",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.14)] text-primary">
                            <UserPlus className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-display text-sm font-semibold text-foreground">Registrate ahora</p>
                            <p className="mt-1 text-xs text-muted-foreground">Crea tu cuenta y continúa.</p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAuthMode("login")}
                        className={cn(
                          "rounded-[1.4rem] border px-4 py-4 text-left transition-all duration-200",
                          authMode === "login"
                            ? "border-primary/30 bg-[hsl(var(--primary)/0.12)] text-foreground shadow-[0_18px_28px_-24px_hsl(var(--primary)/0.8)]"
                            : "border-border bg-[hsl(var(--surface-2))] text-muted-foreground",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.14)] text-primary">
                            <LogIn className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-display text-sm font-semibold text-foreground">Inicia sesion</p>
                            <p className="mt-1 text-xs text-muted-foreground">Accede cuando quieras.</p>
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="section-label block">Correo electrónico</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          required
                          placeholder="ejemplo@correo.com"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
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
                          onChange={(event) => setPassword(event.target.value)}
                          className="pl-11"
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full justify-center rounded-full">
                      {loading ? (
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : authMode === "signup" ? (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Registrate ahora
                        </>
                      ) : (
                        <>
                          <LogIn className="h-4 w-4" />
                          Inicia sesion
                        </>
                      )}
                    </Button>
                  </form>
                ) : null}

                {activeStage === "profile" ? (
                  <form onSubmit={handleOnboardingSubmit} className="space-y-5">
                    <div className="panel-muted p-4">
                      <p className="section-label">Perfil</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground">
                        Completa tus datos básicos para activar tu cuenta dentro de PIDO.
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
                          onChange={(event) => setFullName(event.target.value)}
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
                          onChange={(event) => setDocumentId(event.target.value)}
                          className="pl-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="section-label block">Tipo de perfil</label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[
                          {
                            id: "engineer",
                            title: "Soy Ingeniero",
                            description: "Quiero publicar pedidos y comparar ofertas.",
                            icon: HardHat,
                          },
                          {
                            id: "hardware",
                            title: "Soy Ferretería",
                            description: "Quiero vender y enviar cotizaciones.",
                            icon: Store,
                          },
                        ].map((option) => {
                          const OptionIcon = option.icon;
                          const isSelected = userType === option.id;

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setUserType(option.id as "engineer" | "hardware")}
                              className={cn(
                                "rounded-[1.5rem] border p-4 text-left transition-all duration-200",
                                isSelected
                                  ? "border-primary/30 bg-[hsl(var(--primary)/0.12)] shadow-[0_18px_28px_-24px_hsl(var(--primary)/0.8)]"
                                  : "border-border bg-[hsl(var(--surface-2))]",
                              )}
                            >
                              <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-[hsl(var(--primary)/0.14)] text-primary">
                                <OptionIcon className="h-5 w-5" />
                              </div>
                              <div className="mt-4">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-display text-sm font-semibold text-foreground">{option.title}</h4>
                                  {isSelected ? <span className="data-chip data-chip-accent">Activo</span> : null}
                                </div>
                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{option.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full justify-center rounded-full">
                      {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Guardar perfil"}
                    </Button>
                  </form>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 border-t border-border px-6 py-5 md:flex-row md:items-center md:justify-between md:px-7">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  El enlace al login siempre está disponible.
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStage}
                    disabled={activeStepIndex === 0}
                    className="rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  {activeStage !== "access" && activeStage !== "profile" ? (
                    <Button type="button" onClick={goToNextStage} className="rounded-full">
                      {activeStage === "dispatch" ? "Ir al acceso" : "Continuar"}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Auth;
