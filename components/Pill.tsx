import Link from "next/link";
import { ReactNode } from "react";

interface PillProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  /** Renders as a circular icon-only button — ignores size */
  icon?: boolean;
  /** Renders as a Next.js Link when provided */
  href?: string;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function pillClasses(
  variant: "primary" | "secondary" | "ghost" = "primary",
  size: "sm" | "md" = "md",
  icon = false,
  extra = ""
) {
  const base =
    "inline-flex items-center justify-center rounded-full transition-colors active:opacity-70 disabled:opacity-40";
  const gap = icon ? "" : "gap-1.5";

  const variantClasses: Record<string, string> = {
    primary: "bg-brand-navy text-white font-bold",
    secondary: "bg-chip text-brand-navy font-semibold",
    ghost: "bg-white text-gray-600 font-medium border border-gray-200",
  };

  const sizeClasses = icon
    ? "w-9 h-9"
    : size === "sm"
    ? "text-xs px-3 py-1.5"
    : "text-sm px-4 py-1.5";

  return [base, gap, variantClasses[variant], sizeClasses, extra]
    .filter(Boolean)
    .join(" ");
}

export default function Pill({
  variant = "primary",
  size = "md",
  icon = false,
  href,
  children,
  className,
  onClick,
  disabled,
  type = "button",
}: PillProps) {
  const classes = pillClasses(variant, size, icon, className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
