import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type ButtonHTMLAttributes, forwardRef } from "react";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-brand-600 text-white hover:bg-brand-700 shadow-sm":
              variant === "primary",
            "bg-white text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50 shadow-sm":
              variant === "secondary",
            "text-gray-600 hover:text-gray-900 hover:bg-gray-100":
              variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 shadow-sm":
              variant === "danger",
          },
          {
            "text-xs px-3 py-1.5": size === "sm",
            "text-sm px-4 py-2.5": size === "md",
            "text-base px-6 py-3": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
