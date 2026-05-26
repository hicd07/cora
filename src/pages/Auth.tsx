import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    ArrowRight,
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

const featureHighlights = [{
    title: "Comparación por ítem",
    description: "Evalúa precios, disponibilidad y entrega desde una sola vista.",
    icon: HardHat
}, {
    title: "Proveedores verificados",
    description: "Trabaja con ferreterías activas en Santo Domingo Este.",
    icon: ShieldCheck
}, {
    title: "Despachos por zona",
    description: "Organiza compras y cobertura comercial con claridad.",
    icon: Truck
}];

export const Auth: React.FC = () => {
    const {
        session,
        profile,
        refreshProfile,
        updateProfile,
        loading: sessionLoading
    } = useSessionContext();

    const {
        theme,
        toggleTheme
    } = useTheme();

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
        if (sessionLoading)
            return;

        if (session && profile) {
            if (profile.onboarded) {
                navigate("/", {
                    replace: true
                });
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
                const {
                    data,
                    error
                } = await supabase.auth.signUp({
                    email,
                    password
                });

                dismissToast(toastId);

                if (error) {
                    showError(error.message);
                    return;
                }

                if (data.user) {
                    showSuccess("Cuenta creada. Ahora completa tu perfil.");
                    setIsOnboarding(true);
                }
            } else {
                const {
                    error
                } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

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
                reviews_count: 0
            });

            await refreshProfile();
            dismissToast(toastId);
            showSuccess("Perfil configurado con éxito.");

            navigate("/", {
                replace: true
            });
        } catch (err: any) {
            dismissToast(toastId);
            showError(err.message || "Error al guardar el perfil.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-[hsl(var(--surface-0))] px-4 py-5 md:px-6 md:py-8">
            <div
                className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl flex-col gap-4 md:min-h-[calc(100vh-4rem)]">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="section-label">Acceso seguro</p>
                        <h1 className="font-display text-xl font-semibold text-foreground">PIDO</h1>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleTheme}
                        aria-label="Cambiar tema">
                        {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="grid flex-1 gap-4 md:grid-cols-[1.05fr_0.95fr]">
                    <section className="app-shell relative overflow-hidden p-6 md:p-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_34%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.12),transparent_30%)]" />
                        <div
                            className="panel-strong absolute inset-x-6 top-6 h-28 rounded-[2rem] border-primary/15 bg-[hsl(var(--primary)/0.08)] blur-2xl md:inset-x-8" />
                        <div className="absolute right-6 top-8 hidden h-24 w-24 rounded-full border border-[hsl(var(--primary)/0.18)] bg-[hsl(var(--surface-1)/0.55)] blur-[2px] md:block motion-safe:animate-[float_7s_ease-in-out_infinite]" />
                        <div className="absolute bottom-10 left-8 hidden h-16 w-16 rounded-full border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1)/0.7)] md:block motion-safe:animate-[float_9s_ease-in-out_infinite]" />
                        <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                            <div className="motion-safe:animate-[fade-up_500ms_ease-out]">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.4rem] border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1))] shadow-[0_18px_32px_-24px_hsl(var(--foreground)/0.3)]">
                                        <div className="absolute inset-[4px] rounded-[1.05rem] bg-[hsl(var(--primary)/0.08)]" />
                                        <AppLogo variant="symbol" context="header" size={30} className="relative" />
                                    </div>
                                    <span className="data-chip data-chip-accent">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Bienvenida
                                    </span>
                                </div>
                                <h2
                                    className="font-display mt-6 max-w-md text-3xl font-semibold leading-tight text-foreground md:text-5xl">
                                    {isOnboarding ? "Tu operación empieza con un perfil claro." : isSignUp ? "Empieza hoy y publica solicitudes con más agilidad." : "Bienvenido a una forma más clara de comprar y cotizar."}
                                </h2>
                                <p
                                    className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                                    PIDO conecta ingenieros y ferreterías en una experiencia simple, confiable y visual para gestionar pedidos, ofertas y decisiones comerciales.
                                </p>
                                {!isOnboarding ? (
                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setIsSignUp(true);
                                            }}
                                            className="justify-center rounded-full px-6">
                                            <UserPlus className="h-4 w-4" />
                                            Crear cuenta
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsSignUp(false);
                                            }}
                                            className="inline-flex items-center justify-center gap-2 rounded-full border border-[hsl(var(--foreground)/0.1)] bg-[hsl(var(--surface-1)/0.82)] px-5 py-3 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-[hsl(var(--primary)/0.28)] hover:bg-[hsl(var(--surface-1))]">
                                            Ir directo al login
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                            <div className="grid gap-3 motion-safe:animate-[fade-up_700ms_ease-out]">
                                {featureHighlights.map((item, index) => {
                                    const Icon = item.icon;

                                    return (
                                        <article
                                            key={item.title}
                                            className="panel-muted flex items-start gap-3 p-4 motion-safe:animate-[fade-up_700ms_ease-out]"
                                            style={{ animationDelay: `${index * 90}ms` }}>
                                            <div
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-[hsl(var(--primary)/0.14)] text-primary">
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
                        <div
                            className="border-b border-border bg-[hsl(var(--primary)/0.1)] px-6 py-6 md:px-7 md:py-7">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="section-label">{isOnboarding ? "Paso 2 · Configuración" : isSignUp ? "Nuevo acceso" : "Inicio de sesión"}</p>
                                    <h2 className="font-display mt-2 text-2xl font-semibold text-foreground">
                                        {isOnboarding ? "Completa tu perfil" : isSignUp ? "Crea tu cuenta" : "Inicia sesión"}
                                    </h2>
                                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                        {isOnboarding ? "Necesitamos tus datos básicos para dejar lista tu operación dentro de PIDO." : "Accede a tu espacio de compras, cotizaciones y relaciones comerciales."}
                                    </p>
                                </div>
                                <div
                                    className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.2rem] border border-[hsl(var(--foreground)/0.08)] bg-[hsl(var(--surface-1))] shadow-[0_18px_32px_-24px_hsl(var(--foreground)/0.3)]">
                                    <div
                                        className="absolute inset-[3px] rounded-[0.95rem] bg-[hsl(var(--primary)/0.08)]" />
                                    <AppLogo variant="symbol" context="header" size={26} className="relative" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6 px-6 py-6 md:px-7 md:py-7">
                            {!isOnboarding ? (<form onSubmit={handleAuth} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="section-label block">Correo electrónico</label>
                                    <div className="relative">
                                        <Mail
                                            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="email"
                                            required
                                            placeholder="ejemplo@correo.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="pl-11" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="section-label block">Contraseña</label>
                                    <div className="relative">
                                        <Lock
                                            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="pl-11" />
                                    </div>
                                </div>
                                <Button type="submit" disabled={loading} className="w-full justify-center">
                                    {loading ? (<span
                                        className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />) : isSignUp ? (<><UserPlus className="h-4 w-4" />Registrarse</>) : (<><LogIn className="h-4 w-4" />Ingresar</>)}
                                </Button>
                                <div className="panel-muted p-4">
                                    <p className="section-label">Beneficio</p>
                                    <p className="mt-2 text-sm leading-relaxed text-foreground">Publica pedidos, compara ofertas por ítem y coordina con proveedores verificados desde una sola interfaz.
                                                            </p>
                                </div>
                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsSignUp(!isSignUp)}
                                        className="font-display rounded-full px-3 py-1 text-sm font-semibold text-primary transition-[transform,opacity] duration-200 hover:-translate-y-0.5 hover:opacity-85">
                                        {isSignUp ? "¿Ya tienes una cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
                                    </button>
                                </div>
                            </form>) : (<form onSubmit={handleOnboardingSubmit} className="space-y-5">
                                <div>
                                    <span className="data-chip data-chip-accent">Paso 2 · Configuración</span>
                                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Configura tu identidad comercial o profesional para empezar con la experiencia completa.
                                                            </p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="section-label block">Nombre o razón social</label>
                                    <div className="relative">
                                        <User
                                            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            required
                                            placeholder="Ej: Ing. Juan Pérez / Ferretería El Sol"
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                            className="pl-11" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="section-label block">RNC o cédula</label>
                                    <div className="relative">
                                        <FileText
                                            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            required
                                            placeholder="Ej: 131-XXXXX-X"
                                            value={documentId}
                                            onChange={e => setDocumentId(e.target.value)}
                                            className="pl-11" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label block">Tipo de perfil</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[{
                                            id: "engineer",
                                            title: "Soy Ingeniero",
                                            description: "Quiero publicar pedidos y comparar ofertas.",
                                            icon: HardHat
                                        }, {
                                            id: "hardware",
                                            title: "Soy Ferretería",
                                            description: "Quiero vender y enviar cotizaciones.",
                                            icon: Store
                                        }].map(option => {
                                            const Icon = option.icon;
                                            const isSelected = userType === option.id;

                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => setUserType(option.id as "engineer" | "hardware")}
                                                    className={cn(
                                                        "interactive-card flex min-h-[152px] flex-col justify-between rounded-[1.5rem] border p-4 text-left",
                                                        isSelected ? "border-primary/25 bg-[hsl(var(--primary)/0.12)] shadow-[0_18px_30px_-28px_hsl(var(--primary)/0.7)]" : "border-border bg-card hover:bg-[hsl(var(--surface-2))]"
                                                    )}>
                                                    <div
                                                        className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-[hsl(var(--primary)/0.14)] text-primary">
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
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Después del registro podrás completar sector, cobertura y visibilidad desde tu cuenta. Ya no precargamos datos ficticios en el perfil inicial.
                                                            </p>
                                </div>
                                <Button type="submit" disabled={loading} className="w-full justify-center">
                                    {loading ? <span
                                        className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Guardar perfil"}
                                </Button>
                            </form>)}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Auth;