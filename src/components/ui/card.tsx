import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type HTMLAttributes, forwardRef } from "react";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-5 border-b border-gray-100", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 py-5", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardContent };
