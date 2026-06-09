import { ReactNode } from "react";
import Pill from "@/components/Pill";

interface DetailNavBarProps {
  backHref: string;
  backLabel: string;
  action?: ReactNode;
}

export default function DetailNavBar({ backHref, backLabel, action }: DetailNavBarProps) {
  return (
    <div className="px-4 pt-4 flex items-center justify-between">
      <Pill variant="secondary" size="sm" href={backHref}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {backLabel}
      </Pill>
      {action && <div>{action}</div>}
    </div>
  );
}
