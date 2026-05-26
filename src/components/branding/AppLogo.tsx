import React from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { BrandLogoContext, BrandLogoVariant, resolveBrandAsset } from "./brand-assets";

interface AppLogoProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  variant?: BrandLogoVariant;
  context?: BrandLogoContext;
  size?: number;
  imageClassName?: string;
  alt?: string;
  decorative?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  variant = "symbol",
  context = "auto",
  size = 40,
  className,
  imageClassName,
  alt,
  decorative = false,
  ...props
}) => {
  const { theme } = useTheme();
  const asset = resolveBrandAsset({ variant, context, theme });

  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", className)} {...props}>
      <img
        src={asset.src}
        alt={decorative ? "" : alt ?? asset.alt}
        aria-hidden={decorative || undefined}
        className={cn("block object-contain", variant === "full" ? "w-auto" : "w-full", imageClassName)}
        style={variant === "full" ? { height: size } : { width: size, height: size }}
      />
    </span>
  );
};

export default AppLogo;
