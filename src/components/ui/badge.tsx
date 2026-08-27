import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#09090B] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#09090B] text-white border-transparent",
        emerald:
          "bg-[#18181B] text-white border-transparent",
        mint:
          "bg-[#F4F4F5] text-[#18181B] border border-[#E4E4E7]",
        cream:
          "bg-white text-[#71717A] border border-[#E4E4E7]",
        gold:
          "bg-[#F4F4F5] text-[#09090B] border border-[#D4D4D8]",
        secondary:
          "bg-[#F4F4F5] text-[#18181B] border-transparent",
        destructive:
          "bg-red-50 text-red-700 border border-red-200",
        outline:
          "text-[#09090B] border border-[#E4E4E7] bg-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
