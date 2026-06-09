import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm mb-4">
      <div className="bg-brand-navy px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-bold text-white/60 uppercase tracking-widest">
          {title}
        </span>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}
