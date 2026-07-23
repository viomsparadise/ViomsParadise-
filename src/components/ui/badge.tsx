import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide", {
  variants: {
    variant: {
      default: "bg-forest-800 text-ivory",
      gold: "bg-gold/15 text-gold-dark border border-gold/30",
      outline: "border border-forest-900/20 text-forest-800",
      success: "bg-forest-100 text-forest-700",
      warning: "bg-amber-100 text-amber-800",
      danger: "bg-red-100 text-red-700",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
