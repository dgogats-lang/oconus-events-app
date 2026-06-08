import Link from "next/link";

interface FormNavBarProps {
  backHref: string;
  backLabel: string;
  title: string;
  isPending?: boolean;
  saveLabel?: string;
}

export default function FormNavBar({
  backHref,
  backLabel,
  title,
  isPending = false,
  saveLabel = "Save",
}: FormNavBarProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-5 border-b border-gray-100 bg-white">
      <div className="flex justify-start">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#0C2340] bg-[#F1F5F9] rounded-full px-3 py-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {backLabel}
        </Link>
      </div>
      <p className="text-[15px] font-bold text-[#0C2340] text-center">{title}</p>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="text-sm font-bold text-white bg-[#0C2340] rounded-full px-4 py-1.5 disabled:opacity-40"
        >
          {isPending ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  );
}
