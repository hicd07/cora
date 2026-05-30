import logoGrayBackground from "@/assets/branding/logo-gray-background.svg";
import logoWithoutText from "@/assets/branding/logo-sin-letras.svg";
import logoTransparent from "@/assets/branding/logo-transparent.svg";
import logoWhiteBackground from "@/assets/branding/logo-white-background.svg";

export type BrandTheme = "light" | "dark";
export type BrandLogoVariant = "symbol" | "full";
export type BrandLogoContext = "auto" | "header" | "light" | "dark" | "transparent" | "favicon";

export const brandAssets = {
  symbol: logoWithoutText,
  full: {
    light: logoTransparent,
    dark: logoWhiteBackground,
    header: logoTransparent,
    transparent: logoTransparent,
    favicon: logoGrayBackground,
  },
} as const;

interface ResolveBrandAssetOptions {
  variant?: BrandLogoVariant;
  context?: BrandLogoContext;
  theme?: BrandTheme;
}

export const resolveBrandAsset = ({
  variant = "symbol",
  context = "auto",
  theme = "light",
}: ResolveBrandAssetOptions = {}) => {
  if (variant === "symbol") {
    return {
      src: brandAssets.symbol,
      alt: "Cora",
    };
  }

  const resolvedContext = context === "auto" ? (theme === "dark" ? "dark" : "light") : context;

  return {
    src: brandAssets.full[resolvedContext],
    alt: "Logo de Cora",
  };
};

export const BRAND_FAVICON_PATH = "/favicon.svg";