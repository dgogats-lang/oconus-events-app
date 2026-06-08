import { ReactNode } from "react";

interface RecordHeaderProps {
  title: string;
  eyebrow?: string;
  children?: ReactNode; // badges, mode pills, time info etc.
}

export default function RecordHeader({ title, eyebrow, children }: RecordHeaderProps) {
  return (
    <div className="px-4 pt-4 pb-5">
      {eyebrow && (
        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-extrabold text-[#0C2340] tracking-tight leading-snug">
        {title}
      </h1>
      {children}
    </div>
  );
}
