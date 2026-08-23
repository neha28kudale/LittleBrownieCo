import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-cocoa-dark active:bg-cocoa-dark active:shadow-inner",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/80 active:shadow-inner",
        outline:
          "border border-input bg-background shadow-sm hover:bg-caramel hover:text-cocoa hover:border-caramel active:bg-caramel-dark active:text-parchment active:border-caramel-dark",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-caramel/70 active:bg-caramel-dark active:text-parchment",
        ghost:
          "hover:bg-caramel/40 hover:text-cocoa active:bg-caramel-dark active:text-parchment",
        link: "text-primary underline-offset-4 hover:underline hover:text-cocoa-dark active:text-cocoa-dark",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

type Ripple = { id: number; x: number; y: number; size: number };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const [ripples, setRipples] = React.useState<Ripple[]>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!asChild) {
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        const id = Date.now();
        setRipples((prev) => [...prev, { id, x, y, size }]);
        window.setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
      }
      onClick?.(e);
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {props.children}
        {!asChild &&
          ripples.map((r) => (
            <span
              key={r.id}
              className="ripple-effect"
              style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
            />
          ))}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
