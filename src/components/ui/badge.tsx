import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "destructive" | "warning" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        {
          "bg-muted text-muted-foreground": variant === "default",
          "bg-success/15 text-success": variant === "success",
          "bg-destructive/15 text-destructive": variant === "destructive",
          "bg-warning/15 text-warning": variant === "warning",
          "bg-info/15 text-info": variant === "info",
        },
        className
      )}
      {...props}
    />
  );
}
