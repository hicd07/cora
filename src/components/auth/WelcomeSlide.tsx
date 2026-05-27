import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface WelcomeSlideProps {
  icon: LucideIcon;
  title: string;
  description: string;
  mockup: ReactNode;
}

export const WelcomeSlide: React.FC<WelcomeSlideProps> = ({
  icon: Icon,
  title,
  description,
  mockup,
}) => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-12 flex w-full max-w-sm flex-col items-center justify-center animate-scale-in" style={{ animationDelay: '400ms' }}>
        {/* Decorative background radials */}
        <div className="absolute inset-0 -z-10 bg-primary/10 rounded-full blur-3xl opacity-50 dark:opacity-20" />
        <div className="absolute inset-0 -z-10 bg-accent/20 rounded-full blur-2xl opacity-40 translate-y-8" />
        
        {/* Mockup Container */}
        <div className="w-full">
          {mockup}
        </div>
        
        {/* Icon */}
        <div className="absolute -bottom-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg elevated-outline">
          <Icon className="h-7 w-7" />
        </div>
      </div>

      <div className="mt-8 max-w-sm animate-fade-up" style={{ animationDelay: '250ms' }}>
        <h2 className="mb-3 font-display text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};
