import { ReactNode } from "react";
import Pill from "@/components/Pill";

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export default function PageHeader({ title, eyebrow, action, backHref, backLabel }: PageHeaderProps) {
  return (
    <div className="mb-4">
      {backHref && backLabel && (
        <div className="mb-3">
          <Pill variant="secondary" size="sm" href={backHref}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {backLabel}
          </Pill>
        </div>
      )}
      {eyebrow && (
        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">
          {eyebrow}
        </p>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-[30px] font-extrabold text-[#0C2340] tracking-tight leading-none">
          {title}
        </h1>
        {action}
      </div>
    </div>
  );
}
