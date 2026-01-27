import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { forwardRef } from "react";

export interface ShineButtonProps extends ButtonProps {}

export const ShineButton = forwardRef<HTMLButtonElement, ShineButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "relative inline-flex overflow-hidden bg-primary px-8 py-6 font-medium text-primary-foreground transition-all duration-300 hover:scale-105",
          "before:absolute before:inset-0 before:-z-10 before:translate-x-[-10rem] before:rotate-[35deg] before:bg-[length:200%_200%] before:bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0)_100%)] before:transition-transform before:duration-700 before:ease-in-out hover:before:translate-x-[10rem]",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

ShineButton.displayName = "ShineButton";
