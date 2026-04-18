import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "border border-border text-foreground",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: keyof typeof badgeVariants;
}

function Badge({ className, variant = "secondary", ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                badgeVariants[variant],
                className,
            )}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
