/* Background gradients */
/* Top bar */
/* Main Content */
/* Footer / Controls */
import React, { useEffect, useState } from "react";
import { HardHat, ShieldCheck, Truck, Check, Star, MapPin, Clock } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import AppLogo from "@/components/branding/AppLogo";
import { useTheme } from "@/components/theme/ThemeProvider";
import { SunMedium, Moon } from "lucide-react";
import { WelcomeSlide } from "./WelcomeSlide";
import { WelcomeDots } from "./WelcomeDots";

interface WelcomeCarouselProps {
    onLogin: () => void;
    onSignup: () => void;
}

const slides = [{
    id: "compare",
    icon: HardHat,
    title: "Compara ofertas reales",
    description: "Evalúa precios, disponibilidad y entrega desde una sola vista sin saltar entre chats.",

    mockup: (<div
        className="panel-muted w-full p-4 interactive-card relative overflow-hidden">
        <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Cotización #128</span>
            <span className="data-chip data-chip-accent bg-[#e9a21b]">4 OFERTAS</span>
        </div>
        <div className="space-y-2">
            {[{
                price: "$12,450",
                provider: "Ferretería El Sol",
                best: true
            }, {
                price: "$13,100",
                provider: "Materiales del Este",
                best: false
            }, {
                price: "$13,850",
                provider: "Constructor SR",
                best: false
            }].map((offer, i) => (<div
                key={i}
                className="app-shell flex items-center justify-between p-3 interactive-row">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{offer.price}</span>
                    <span className="text-xs text-muted-foreground">{offer.provider}</span>
                </div>
                {offer.best && (<div
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-success">
                    <Check className="h-4 w-4" />
                </div>)}
            </div>))}
        </div>
    </div>)
}, {
    id: "providers",
    icon: ShieldCheck,
    title: "Proveedores que sí responden",
    description: "Trabaja con ferreterías verificadas y acelera la validación comercial.",

    mockup: (<div
        className="app-shell flex flex-col items-center justify-center p-6 interactive-card relative overflow-hidden">
        <div
            className="relative mt-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-2 border-2 border-primary/20 text-3xl font-bold text-primary shadow-sm">F
        </div>
        <h3 className="mt-4 font-semibold text-foreground">Ferretería El Fuerte</h3>
        <div
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-foreground">4.8</span>
            <span>(124 despachos)</span>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="data-chip">Materiales</span>
            <span className="data-chip">Acero</span>
        </div>
    </div>)
}, {
    id: "dispatch",
    icon: Truck,
    title: "Despachos sin sorpresas",
    description: "Visualiza cobertura y logística antes de cerrar la compra para reducir fricción.",

    mockup: (<div className="panel-strong w-full p-5 interactive-card">
        <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Cobertura activa</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
            {["SDE", "Distrito Nacional", "SDN", "Boca Chica"].map((zone, i) => (<div
                key={i}
                className="app-shell flex flex-col items-center justify-center py-3 text-center">
                <span className="text-xs font-semibold text-foreground">{zone}</span>
                {i === 0 && <span className="mt-1 text-[10px] text-success font-medium">Despacho gratis</span>}
            </div>))}
        </div>
        <div
            className="mt-4 flex items-center justify-between rounded-xl bg-surface-2 p-3 border border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Tiempo prom.</span>
            </div>
            <span className="font-mono font-semibold text-primary">24h - 48h</span>
        </div>
    </div>)
}];

export const WelcomeCarousel: React.FC<WelcomeCarouselProps> = (
    {
        onLogin,
        onSignup
    }
) => {
    const {
        theme,
        toggleTheme
    } = useTheme();

    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!api)
            return;

        setCurrent(api.selectedScrollSnap());

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    return (
        <div
            className="flex min-h-[100dvh] w-full flex-col bg-background relative overflow-hidden">
            {}
            <div
                className="absolute top-0 -left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div
                className="absolute bottom-40 -right-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl opacity-50 pointer-events-none" />
            {}
            <header
                className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:px-8 animate-fade-down"
                style={{
                    animationDelay: "100ms"
                }}>
                <AppLogo />
                <button
                    onClick={toggleTheme}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-1/50 backdrop-blur-md border border-border hover:bg-surface-2 transition-colors"
                    aria-label="Toggle theme">
                    {theme === "dark" ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
            </header>
            {}
            <main
                className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto pt-16 pb-32">
                <Carousel
                    setApi={setApi}
                    opts={{
                        loop: false
                    }}
                    className="w-full">
                    <CarouselContent>
                        {slides.map(slide => (<CarouselItem key={slide.id} className="h-full">
                            <WelcomeSlide
                                icon={slide.icon}
                                title={slide.title}
                                description={slide.description}
                                mockup={slide.mockup} />
                        </CarouselItem>))}
                    </CarouselContent>
                </Carousel>
            </main>
            {}
            <div
                className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center bg-gradient-to-t from-background via-background to-transparent pb-8 pt-12 px-6">
                <div className="w-full max-w-md mx-auto space-y-8">
                    <WelcomeDots
                        count={slides.length}
                        activeIndex={current}
                        onSelect={idx => api?.scrollTo(idx)} />
                    <div
                        className="flex flex-col gap-3 animate-fade-up"
                        style={{
                            animationDelay: "550ms"
                        }}>
                        <Button
                            size="lg"
                            className="w-full h-14 rounded-2xl text-[15px] font-semibold shadow-lg hover:shadow-xl transition-all"
                            onClick={onSignup}>Crear cuenta gratis
                                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground hover:text-foreground"
                            onClick={onLogin}>Ya tengo cuenta · Iniciar sesión
                                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};