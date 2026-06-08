import Link from "next/link";
import { ReactNode } from "react";

interface DetailNavBarProps {
  backHref: string;
  backLabel: string;
  action?: ReactNode;
}

export default function DetailNavBar({ backHref, backLabel, action }: DetailNavBarProps) {
  return (
    <div className="px-4 pt-4 flex items-center justify-between">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#0C2340] bg-[#F1F5F9] rounded-full px-3 py-1.5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {backLabel}
      </Link>
      {action && <div>{action}</div>}
    </div>
  );
}
