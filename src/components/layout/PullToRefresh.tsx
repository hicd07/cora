import React, { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { showSuccess } from "@/utils/toast";

interface PullToRefreshProps {
  children: React.ReactNode;
}

const PULL_THRESHOLD = 84;
const MAX_PULL = 120;

const PullToRefresh: React.FC<PullToRefreshProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (event: TouchEvent) => {
      if (container.scrollTop > 0 || isRefreshing) return;
      startYRef.current = event.touches[0]?.clientY ?? null;
      pullingRef.current = true;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!pullingRef.current || startYRef.current === null || isRefreshing) return;

      const currentY = event.touches[0]?.clientY ?? startYRef.current;
      const delta = currentY - startYRef.current;

      if (delta <= 0) {
        setPullDistance(0);
        return;
      }

      if (container.scrollTop > 0) {
        setPullDistance(0);
        return;
      }

      const nextDistance = Math.min(MAX_PULL, delta * 0.45);
      setPullDistance(nextDistance);

      if (delta > 6) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      pullingRef.current = false;
      startYRef.current = null;

      if (pullDistance < PULL_THRESHOLD || isRefreshing) {
        setPullDistance(0);
        return;
      }

      setIsRefreshing(true);
      setPullDistance(56);

      await queryClient.invalidateQueries();

      showSuccess("Contenido actualizado");
      setIsRefreshing(false);
      setPullDistance(0);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isRefreshing, pullDistance, queryClient]);

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto overscroll-contain">
      <div
        className="pointer-events-none sticky top-0 z-30 flex justify-center"
        style={{ height: pullDistance > 0 || isRefreshing ? `${pullDistance}px` : "0px" }}
      >
        <div
          className={cn(
            "mt-3 flex items-center gap-2 rounded-full border border-border/70 bg-[hsl(var(--surface-1)/0.96)] px-4 py-2 text-xs font-medium text-muted-foreground shadow-[0_18px_40px_-28px_hsl(var(--foreground)/0.45)] transition-all",
            (pullDistance > 0 || isRefreshing) ? "opacity-100" : "opacity-0",
          )}
          style={{ transform: `scale(${0.88 + progress * 0.12})` }}
        >
          <LoaderCircle className={cn("h-4 w-4 text-primary", (isRefreshing || pullDistance >= PULL_THRESHOLD) && "animate-spin")} />
          <span>{isRefreshing ? "Actualizando..." : pullDistance >= PULL_THRESHOLD ? "Suelta para actualizar" : "Desliza para actualizar"}</span>
        </div>
      </div>

      <div
        style={{ transform: `translateY(${pullDistance > 0 || isRefreshing ? 0 : 0}px)` }}
        className="min-h-full"
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;