import React from "react";
import { cn } from "@/lib/utils";

interface WelcomeDotsProps {
  count: number;
  activeIndex: number;
  onSelect?: (index: number) => void;
}

export const WelcomeDots: React.FC<WelcomeDotsProps> = ({
  count,
  activeIndex,
  onSelect,
}) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => onSelect?.(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300 ease-in-out",
              isActive 
                ? "w-6 bg-primary" 
                : "w-2 bg-primary/20 hover:bg-primary/40 dark:bg-primary/30"
            )}
          />
        );
      })}
    </div>
  );
};
