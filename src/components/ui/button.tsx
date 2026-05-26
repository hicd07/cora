import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "font-display inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-transparent text-sm font-semibold tracking-tight shadow-[0_14px_28px_-24px_hsl(var(--foreground)/0.5)] transition-[transform,box-shadow,background-color,color,border-color,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-[0_20px_34px_-24px_hsl(var(--primary)/0.7)]",
        destructive: "bg-destructive text-destructive-foreground hover:-translate-y-0.5 hover:bg-destructive/92 hover:shadow-[0_20px_34px_-24px_hsl(var(--destructive)/0.7)]",
        outline: "border-border/80 bg-[hsl(var(--surface-1)/0.88)] text-foreground shadow-none hover:-translate-y-0.5 hover:border-primary/20 hover:bg-[hsl(var(--surface-2))] hover:shadow-[0_16px_30px_-26px_hsl(var(--foreground)/0.4)]",
        secondary: "border-transparent bg-secondary text-secondary-foreground shadow-none hover:-translate-y-0.5 hover:bg-[hsl(var(--surface-3))] hover:text-foreground hover:shadow-[0_16px_30px_-26px_hsl(var(--foreground)/0.35)]",
        ghost: "border-transparent bg-transparent text-muted-foreground shadow-none hover:-translate-y-0.5 hover:bg-[hsl(var(--surface-2))] hover:text-foreground",
        link: "h-auto rounded-none border-none px-0 py-0 text-primary shadow-none active:scale-100 hover:text-primary/80 hover:underline underline-offset-4",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-11 w-11 rounded-[1.25rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
