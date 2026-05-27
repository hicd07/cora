import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
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
] as const;

const stepperItems = [
  {
    id: "welcome",
    label: "Bienvenida",
    title: "Conoce PIDO",
    description: "Una introducción rápida antes de entrar o crear tu cuenta.",
  },
  {
    id: "access",
    label: "Acceso",
    title: "Entra o crea tu cuenta",
    description: "Elige si quieres iniciar sesión o registrarte para seguir.",
  },
  {
    id: "profile",
    label: "Perfil",
    title: "Completa tu configuración",
    description: "Define tu tipo de operación y deja lista tu experiencia.",
  },
] as const;

type StepKey = (typeof stepperItems)[number]["id"];
type AuthMode = "login" | "signup";

export const Auth: React.FC = () => {
  const { session, profile, refreshProfile, updateProfile, loading: sessionLoading } = useSessionContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState<StepKey>("welcome");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [userType, setUserType] = useState<"engineer" | "hardware" | null>(null);

  const canAccessProfileStep = !!session && !!profile && !profile.onboarded;

  useEffect(() => {
    if (sessionLoading) return;

    if (session && profile) {
      if (profile.onboarded) {
        navigate("/", { replace: true });
        return;
      }

      setFullName(profile.full_name || profile.store_name || "");
      setDocumentId(profile.document_id || "");
      setUserType(profile.user_type || null);
      setActiveStep("profile");
    }
  }, [session, profile, sessionLoading, navigate]);

  const activeStepIndex = stepperItems.findIndex((step) => step.id === activeStep);

  const openLoginStep = () => {
    setAuthMode("login");
    setActiveStep("access");
  };

  const openSignupStep = () => {
    setAuthMode("signup");
    setActiveStep("access");
  };

  const handleStepSelection = (step: StepKey) => {
    if (step === "profile" && !canAccessProfileStep) return;
    setActiveStep(step);
  };

  const heroCopy = useMemo(() => {
    if (activeStep === "profile") {
      return {
        badge: "Configuración final",
        title: "Ya casi terminas: activa tu perfil y entra con todo listo.",
        description:
          "Este último paso define si operas como ingeniero o ferretería. Con eso PIDO adapta tu experiencia, tus vistas y tus oportunidades.",
      };
    }

    if (activeStep === "access") {
      return {
        badge: authMode === "signup" ? "Registro guiado" : "Acceso directo",
        title:
          authMode === "signup"
            ? "Crea tu cuenta y avanza al siguiente paso del onboarding."
            : "Si ya conoces PIDO, entra directo sin perder tiempo.",
        description:
          authMode === "signup"
            ? "Después del registro te llevamos a la configuración de tu perfil para personalizar tu operación desde el inicio."
            : "Inicia sesión y continúa tu flujo habitual. Si todavía no tienes cuenta, puedes cambiar a registro en un toque.",
      };
    }

    return {
      badge: "Bienvenida guiada",
      title: "Te damos la bienvenida a una experiencia B2B más clara, ágil y ordenada.",
      description:
        "PIDO organiza solicitudes, ofertas y compras en un onboarding simple: primero entiendes el flujo, luego accedes y finalmente activas tu perfil.",
    };
  }, [activeStep, authMode]);

  const sidePanelCopy = useMemo(() => {
    if (activeStep === "profile") {
      return {
        eyebrow: "Paso 3 · Perfil",
        title: "Completa tu configuración",
        description: "Necesitamos tus datos básicos para dejar lista tu operación dentro de PIDO.",
      };
    }

    if (activeStep === "access") {
      return {
        eyebrow: authMode === "signup" ? "Paso 2 · Registro" : "Paso 2 · Login",
        title: authMode === "signup" ? "Crea tu acceso" : "Entra a tu cuenta",
        description:
          authMode === "signup"
            ? "Regístrate para continuar al último paso del onboarding."
            : "Inicia sesión si quieres saltarte la introducción e ir directo a tu panel.",
      };
    }

    return {
      eyebrow: "Paso 1 · Bienvenida",
      title: "Comienza el recorrido",
      description: "Elige si quieres explorar, iniciar sesión o empezar tu registro desde aquí.",
    };
  }, [activeStep, authMode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

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
          setActiveStep("profile");
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
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col gap-4 md:min-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">Onboarding de acceso</p>
            <h1 className="font-display text-[32px] font-semibold leading-none text-foreground">PIDO</h1>
          </div>
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid flex-1 gap-4 md:grid-cols-[1.08fr_0.92fr]">
          <section className="app-shell relative overflow-hidden p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.2),transparent_34%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.12),transparent_34%)]" />
            <div className="panel-strong absolute inset-x-6 top-6 h-32 rounded-[2rem] border-primary/15 bg-[hsl(var(--primary)/0.08)] blur-2xl md:inset-x-8" />
            <div className="absolute right-6 top-8 hidden h-24 w-24 rounded-full border border-[hsl(var(--primary)/0.18)] bg-[hsl(var(--surface-1)/0.55)] blur-[2px] md:block motion-safe:animate-[float_7s_ease-in-out_infinite]" />
            <div className="absolute bottom-12 left-8 hidden h-16 w-16 rounded-full border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1)/0.7)] md:block motion-safe:animate-[float_9s_ease-in-out_infinite]" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div className="motion-safe:animate-[fade-up_500ms_ease-out]">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.4rem] border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1))] shadow-[0_18px_32px_-24px_hsl(var(--foreground)/0.3)]">
                    <div className="absolute inset-[4px] rounded-[1.05rem] bg-[hsl(var(--primary)/0.08)]" />
                    <AppLogo variant="symbol" context="header" size={30} className="relative" />
                  </div>
                  <span className="data-chip data-chip-accent">
                    <Sparkles className="h-3.5 w-3.5" />
                    {heroCopy.badge}
                  </span>
                </div>

                <h2 className="font-display mt-6 max-w-xl text-3xl font-semibold leading-tight text-foreground md:text-5xl">
                  {heroCopy.title}
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">{heroCopy.description}</p>
              </div>

              <div className="grid gap-3 motion-safe:animate-[fade-up_700ms_ease-out]">
                {stepperItems.map((step, index) => {
                  const isActive = step.id === activeStep;
                  const isCompleted = index < activeStepIndex;
                  const isLocked = step.id === "profile" && !canAccessProfileStep;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => handleStepSelection(step.id)}
                      disabled={isLocked}
                      className={cn(
                        "panel-muted flex w-full items-start gap-4 p-4 text-left transition-all duration-200",
                        isActive && "border-primary/30 bg-[hsl(var(--primary)/0.12)] shadow-[0_18px_30px_-28px_hsl(var(--primary)/0.6)]",
                        isLocked && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                          isCompleted || isActive
                            ? "border-primary/30 bg-primary text-primary-foreground"
                            : "border-[hsl(var(--foreground)/0.1)] bg-[hsl(var(--surface-1))] text-muted-foreground",
                        )}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-display text-sm font-semibold text-foreground">{step.title}</p>
                          <span className="data-chip">{step.label}</span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground md:text-sm">{step.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 motion-safe:animate-[fade-up_900ms_ease-out]">
                {featureHighlights.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.title}
                      className="panel-muted flex items-start gap-3 p-4 motion-safe:animate-[fade-up_900ms_ease-out]"
                      style={{ animationDelay: `${index * 110}ms` }}
                    >
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
                  <p className="section-label">{sidePanelCopy.eyebrow}</p>
                  <h2 className="font-display mt-2 text-2xl font-semibold text-foreground">{sidePanelCopy.title}</h2>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{sidePanelCopy.description}</p>
                </div>
                <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.2rem] border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1))] shadow-[0_18px_32px_-24px_hsl(var(--foreground)/0.3)]">
                  <div className="absolute inset-[3px] rounded-[0.95rem] bg-[hsl(var(--primary)/0.08)]" />
                  <AppLogo variant="symbol" context="header" size={26} className="relative" />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
                {stepperItems.map((step, index) => {
                  const isActive = step.id === activeStep;
                  const isCompleted = index < activeStepIndex;
                  const isLocked = step.id === "profile" && !canAccessProfileStep;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => handleStepSelection(step.id)}
                      disabled={isLocked}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                        isActive
                          ? "border-primary/30 bg-primary text-primary-foreground"
                          : isCompleted
                            ? "border-primary/20 bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--warning-foreground))]"
                            : "border-border bg-[hsl(var(--surface-1))] text-muted-foreground",
                        isLocked && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--background)/0.55)] text-[11px]">
                        {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      {step.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6 px-6 py-6 md:px-7 md:py-7">
              {activeStep === "welcome" ? (
                <div className="space-y-5 motion-safe:animate-[fade-up_500ms_ease-out]">
                  <div className="panel-muted p-5">
                    <p className="section-label">Qué sigue</p>
                    <p className="mt-3 text-sm leading-relaxed text-foreground">
                      Este onboarding está pensado para que entiendas el flujo sin fricción. Puedes continuar paso a paso o saltar directo al login si ya tienes cuenta.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <Button type="button" onClick={openSignupStep} className="w-full justify-center rounded-full">
                      <UserPlus className="h-4 w-4" />
                      Empezar con registro
                    </Button>
                    <Button type="button" variant="outline" onClick={openLoginStep} className="w-full justify-center rounded-full">
                      <LogIn className="h-4 w-4" />
                      Ir directo al login
                    </Button>
                  </div>

                  <div className="panel-muted p-5">
                    <p className="section-label">Valor</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Desde aquí podrás publicar solicitudes, comparar ofertas por ítem y coordinar compras con proveedores verificados desde una sola interfaz.
                    </p>
                  </div>
                </div>
              ) : null}

              {activeStep === "access" ? (
                <form onSubmit={handleAuth} className="space-y-5 motion-safe:animate-[fade-up_500ms_ease-out]">
                  <div className="panel-muted p-4">
                    <p className="section-label">Resumen</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      {authMode === "signup"
                        ? "Crea tu cuenta y al terminar te llevamos al último paso para completar tu perfil."
                        : "Inicia sesión si ya conoces PIDO y quieres entrar directamente a tu panel."}
                    </p>
                  </div>

                  <div className="flex gap-2 rounded-full bg-[hsl(var(--surface-2))] p-1">
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className={cn(
                        "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                        authMode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                      )}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className={cn(
                        "flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                        authMode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                      )}
                    >
                      Registro
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

                  <Button type="submit" disabled={loading} className="w-full justify-center rounded-full">
                    {loading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : authMode === "signup" ? (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Crear cuenta y continuar
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" />
                        Entrar a PIDO
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setActiveStep("welcome")}
                      className="font-display rounded-full px-3 py-1 text-sm font-semibold text-primary transition-[transform,opacity] duration-200 hover:-translate-y-0.5 hover:opacity-85"
                    >
                      Volver a la bienvenida
                    </button>
                  </div>
                </form>
              ) : null}

              {activeStep === "profile" ? (
                <form onSubmit={handleOnboardingSubmit} className="space-y-5 motion-safe:animate-[fade-up_500ms_ease-out]">
                  <div>
                    <span className="data-chip data-chip-accent">Paso 3 · Configuración</span>
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
                            <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-[hsl(var(--primary)/0.14)] text-primary">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-display text-sm font-semibold text-foreground">{option.title}</h3>
                                {isSelected ? <span className="data-chip data-chip-accent">Activo</span> : null}
                              </div>
                              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{option.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="panel-muted p-4">
                    <p className="section-label">Importante</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Después del registro podrás completar sector, cobertura y visibilidad desde tu cuenta. Ya no precargamos datos ficticios en el perfil inicial.
                    </p>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full justify-center rounded-full">
                    {loading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      "Guardar perfil"
                    )}
                  </Button>
                </form>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Auth;
