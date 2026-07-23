import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-forest-800 text-ivory hover:bg-forest-700 shadow-soft",
        gold: "bg-gold text-forest-950 hover:bg-gold-light shadow-soft",
        outline: "border border-forest-800/30 text-forest-800 hover:bg-forest-800 hover:text-ivory",
        ghost: "text-forest-800 hover:bg-forest-800/5",
        ember: "bg-ember text-ivory hover:bg-ember-light shadow-soft",
        link: "text-forest-800 underline-offset-4 hover:underline",
        outlineLight: "border border-ivory/40 text-ivory hover:bg-ivory hover:text-forest-900",
      },
      size: {
        default: "h-12 px-7",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-9 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
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
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
