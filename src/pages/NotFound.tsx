import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Compass, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-0))] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
        <section className="app-shell w-full p-6 text-center md:p-8">
          <div className="panel-strong mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] border-primary/15 bg-[hsl(var(--primary)/0.08)]">
            <TriangleAlert className="h-9 w-9 text-primary" />
          </div>

          <span className="data-chip data-chip-accent mt-5">Ruta no encontrada</span>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">404</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            La página que intentaste abrir no existe o fue movida. Puedes volver al inicio y continuar desde tu panel principal.
          </p>

          <div className="panel-muted mt-6 flex items-center gap-3 p-4 text-left">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-[hsl(var(--primary)/0.14)] text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-foreground">Ruta consultada</p>
              <p className="mono-data mt-1 break-all text-xs text-muted-foreground">{location.pathname}</p>
            </div>
          </div>

          <Button asChild className="mt-6">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />Volver al inicio
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
};

export default NotFound;
