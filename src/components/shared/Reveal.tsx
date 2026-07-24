import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li" | "ul" | "header" | "footer";
  style?: CSSProperties;
};

export function Reveal({ children, className, delay = 0, as: Tag = "div", style }: Props) {
  const { ref, inView } = useInView();
  return (
    <Tag
      ref={ref as never}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      className={cn(
        "will-change-transform transition-all duration-700 ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Stagger children: each direct child fades/slides in with a cascading delay.
 * Uses a container `inView` gate + per-child transition-delay via CSS variable.
 */
export function Stagger({
  children,
  className,
  step = 75,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  step?: number;
  as?: "div" | "ul" | "section";
}) {
  const { ref, inView } = useInView(0.08);
  return (
    <Tag
      ref={ref as never}
      data-in={inView ? "true" : "false"}
      style={{ ["--stagger" as string]: `${step}ms` }}
      className={cn("stagger", className)}
    >
      {children}
    </Tag>
  );
}
