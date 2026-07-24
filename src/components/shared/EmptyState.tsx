import { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 sm:p-12 text-center border border-dashed rounded-lg bg-card/50", className)}>
      {Icon && (
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 sm:mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
