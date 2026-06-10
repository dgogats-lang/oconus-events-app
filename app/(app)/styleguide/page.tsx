export default function StyleguidePage() {
  return (
    <div className="min-h-screen bg-surface-page pb-28">

      {/* Header */}
      <div className="px-4 pt-6 pb-6">
        <p className="text-[10px] font-extrabold text-ink-muted tracking-widest uppercase mb-1.5">
          OCONUS Events App
        </p>
        <h1 className="text-[30px] font-extrabold text-ink tracking-tight leading-none">
          Design System
        </h1>
        <p className="text-ink-secondary text-sm mt-2">
          Direction B — Modern Travel Ops
        </p>
      </div>

      {/* ── COLORS ─────────────────────────────────────────────────────── */}
      <section className="px-4 mb-10">
        <h2 className="text-[11px] font-extrabold text-ink-muted tracking-widest uppercase mb-4">
          Colors
        </h2>

        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Brand</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="bg-brand-navy rounded-card p-4">
            <p className="text-ink-inverse text-sm font-bold">Navy</p>
            <p className="text-ink-inverse-muted text-xs mt-0.5">#0C2340</p>
            <p className="text-ink-inverse-muted text-[10px] mt-1 font-mono">brand.navy</p>
            <p className="text-ink-inverse-muted text-[10px] mt-0.5">Headings, primary actions, active tab</p>
          </div>
          <div className="bg-brand-gold rounded-card p-4">
            <p className="text-white text-sm font-bold">Gold</p>
            <p className="text-white/70 text-xs mt-0.5">#D4A853</p>
            <p className="text-white/70 text-[10px] mt-1 font-mono">brand.gold</p>
            <p className="text-white/70 text-[10px] mt-0.5">Meet callouts, warm highlights</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Surfaces</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-surface-page border border-line rounded-panel p-3">
            <p className="text-ink text-xs font-bold">Page</p>
            <p className="text-ink-muted text-[10px] mt-0.5">#EEF2F7</p>
            <p className="text-ink-muted text-[10px] font-mono">surface.page</p>
          </div>
          <div className="bg-surface-card border border-line rounded-panel p-3">
            <p className="text-ink text-xs font-bold">Card</p>
            <p className="text-ink-muted text-[10px] mt-0.5">#FFFFFF</p>
            <p className="text-ink-muted text-[10px] font-mono">surface.card</p>
          </div>
          <div className="bg-surface-chip border border-line rounded-panel p-3">
            <p className="text-ink text-xs font-bold">Chip</p>
            <p className="text-ink-muted text-[10px] mt-0.5">#F1F5F9</p>
            <p className="text-ink-muted text-[10px] font-mono">surface.chip</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Ink (text)</p>
        <div className="bg-surface-card border border-line rounded-card overflow-hidden mb-5">
          {[
            { label: "Primary", cls: "text-ink", token: "ink / ink-DEFAULT", hex: "#0C2340", sample: "Today — Munich Summit" },
            { label: "Secondary", cls: "text-ink-secondary", token: "ink-secondary", hex: "#64748B", sample: "James Wilson · Delta DL401" },
            { label: "Muted", cls: "text-ink-muted", token: "ink-muted", hex: "#94A3B8", sample: "Last updated 3 min ago" },
          ].map(({ label, cls, token, hex, sample }, i, arr) => (
            <div key={label} className={`px-4 py-3 ${i < arr.length - 1 ? "border-b border-line-subtle" : ""}`}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] text-ink-muted font-mono">{token} · {hex}</span>
              </div>
              <p className={`text-sm font-medium ${cls}`}>{sample}</p>
            </div>
          ))}
        </div>

        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Status</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-status-ok-bg border border-status-ok-text/20 rounded-panel p-3">
            <p className="text-status-ok-text text-xs font-bold">Confirmed / OK</p>
            <p className="text-status-ok-text/70 text-[10px] mt-0.5 font-mono">status.ok-bg / ok-text</p>
          </div>
          <div className="bg-status-warn-bg border border-status-warn-text/20 rounded-panel p-3">
            <p className="text-status-warn-text text-xs font-bold">Warning / Pending</p>
            <p className="text-status-warn-text/70 text-[10px] mt-0.5 font-mono">status.warn-bg / warn-text</p>
          </div>
          <div className="bg-status-gold-bg border border-brand-gold/25 rounded-panel p-3">
            <p className="text-status-gold-text text-xs font-bold">Meet callout</p>
            <p className="text-brand-gold/70 text-[10px] mt-0.5 font-mono">status.gold-bg / gold-text</p>
          </div>
          <div className="bg-brand-red/10 border border-brand-red/20 rounded-panel p-3">
            <p className="text-brand-red text-xs font-bold">Alert / Error</p>
            <p className="text-brand-red/70 text-[10px] mt-0.5 font-mono">brand.red</p>
          </div>
        </div>
      </section>

      {/* ── TYPOGRAPHY ─────────────────────────────────────────────────── */}
      <section className="px-4 mb-10">
        <h2 className="text-[11px] font-extrabold text-ink-muted tracking-widest uppercase mb-4">
          Typography
        </h2>
        <div className="bg-surface-card rounded-card border border-line overflow-hidden">
          <div className="px-4 py-4 border-b border-line-subtle">
            <p className="text-[10px] text-ink-muted font-mono mb-1.5">
              Eyebrow · text-[10px] extrabold tracking-widest uppercase
            </p>
            <p className="text-[10px] font-extrabold text-ink-muted tracking-widest uppercase">
              HOH Europe Summits 2026
            </p>
          </div>
          <div className="px-4 py-4 border-b border-line-subtle">
            <p className="text-[10px] text-ink-muted font-mono mb-1.5">
              Page title · text-[30px] extrabold tracking-tight
            </p>
            <p className="text-[30px] font-extrabold text-ink tracking-tight leading-none">
              Today
            </p>
          </div>
          <div className="px-4 py-4 border-b border-line-subtle">
            <p className="text-[10px] text-ink-muted font-mono mb-1.5">
              Record title · text-2xl extrabold tracking-tight
            </p>
            <p className="text-2xl font-extrabold text-ink tracking-tight">
              James Wilson
            </p>
          </div>
          <div className="px-4 py-4 border-b border-line-subtle">
            <p className="text-[10px] text-ink-muted font-mono mb-1.5">
              Section heading · text-lg bold
            </p>
            <p className="text-lg font-bold text-ink">Hotels</p>
          </div>
          <div className="px-4 py-4 border-b border-line-subtle">
            <p className="text-[10px] text-ink-muted font-mono mb-1.5">
              Body · text-sm text-ink-secondary
            </p>
            <p className="text-sm text-ink-secondary">
              Arrives at MUC T2 at 14:35. Travel package included. Hotel assigned at Marriott City Center.
            </p>
          </div>
          <div className="px-4 py-4">
            <p className="text-[10px] text-ink-muted font-mono mb-1.5">
              Label / meta · text-xs text-ink-muted
            </p>
            <p className="text-xs text-ink-muted">3 guests · Check-in 09 Jun · Room 412</p>
          </div>
        </div>
      </section>

      {/* ── COMPONENTS ─────────────────────────────────────────────────── */}
      <section className="px-4 mb-10">
        <h2 className="text-[11px] font-extrabold text-ink-muted tracking-widest uppercase mb-4">
          Components
        </h2>

        {/* Page header */}
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Page header (list pages)</p>
        <div className="bg-surface-card border border-line rounded-card px-4 pt-5 pb-4 mb-5">
          <p className="text-[10px] font-extrabold text-ink-muted tracking-widest uppercase mb-1.5">
            HOH Europe Summits 2026
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-[30px] font-extrabold text-ink tracking-tight leading-none">
              Attendees
            </h1>
            <span className="bg-brand-navy text-ink-inverse text-xs font-bold px-4 py-1.5 rounded-full">
              + Add
            </span>
          </div>
        </div>

        {/* Detail nav bar */}
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Detail nav bar (detail / sub pages)</p>
        <div className="bg-surface-card border border-line rounded-card px-4 py-3 mb-5 flex items-center justify-between">
          <span className="bg-surface-chip text-ink text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Attendees
          </span>
          <span className="bg-surface-chip text-ink text-xs font-semibold w-9 h-9 rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </span>
        </div>

        {/* Form nav bar */}
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Form nav bar (add / edit pages)</p>
        <div className="bg-surface-card border border-line rounded-card px-4 py-4 mb-5 grid grid-cols-3 items-center">
          <span className="bg-surface-chip text-ink text-xs font-semibold px-3 py-1.5 rounded-full text-center">Cancel</span>
          <span className="text-sm font-bold text-ink text-center">Add Hotel</span>
          <span className="bg-brand-navy text-ink-inverse text-xs font-bold px-3 py-1.5 rounded-full text-center">Save</span>
        </div>

        {/* Section card */}
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Section card (navy header)</p>
        <div className="rounded-card overflow-hidden border border-line mb-5">
          <div className="bg-brand-navy px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] font-bold text-ink-inverse/60 uppercase tracking-widest">Hotels</span>
            <span className="text-[11px] text-ink-inverse-muted">View all →</span>
          </div>
          <div className="bg-surface-card">
            <div className="px-4 py-3 border-b border-line-subtle flex justify-between items-center">
              <span className="text-sm font-medium text-ink">Marriott City Center</span>
              <span className="text-sm text-ink-muted">18</span>
            </div>
            <div className="px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-medium text-ink">Vier Jahreszeiten</span>
              <span className="text-sm text-ink-muted">7</span>
            </div>
          </div>
        </div>

        {/* Standard white card */}
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Standard white card</p>
        <div className="bg-surface-card rounded-card border border-line mb-5">
          <div className="px-4 py-4 border-b border-line-subtle flex justify-between items-center">
            <div>
              <p className="text-xs text-ink-muted mb-0.5">Arrivals today</p>
              <p className="text-2xl font-extrabold text-ink tracking-tight">
                9 <span className="text-sm font-normal text-ink-muted">of 12</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-status-ok-bg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
              </svg>
            </div>
          </div>
          <div className="px-4 py-3 flex justify-between items-center border-b border-line-subtle">
            <span className="text-sm text-ink">Next arrival in 42 min</span>
            <span className="text-xs text-ink-muted">LH 2031</span>
          </div>
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-ink">3 still in transit</span>
            <span className="text-xs text-ink-muted">View all →</span>
          </div>
        </div>

        {/* Pills */}
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Pills</p>
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="bg-brand-navy text-ink-inverse text-xs font-bold px-3 py-1.5 rounded-full">Primary</span>
          <span className="bg-surface-chip text-ink text-xs font-semibold px-3 py-1.5 rounded-full">Secondary</span>
          <span className="bg-surface-chip text-ink text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </span>
          <span className="bg-status-ok-bg text-status-ok-text text-xs font-semibold px-3 py-1.5 rounded-full">Confirmed</span>
          <span className="bg-status-warn-bg text-status-warn-text text-xs font-semibold px-3 py-1.5 rounded-full">Pending</span>
          <span className="bg-brand-red/10 text-brand-red text-xs font-semibold px-3 py-1.5 rounded-full">Alert</span>
        </div>

        {/* Callouts */}
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Callout blocks</p>
        <div className="space-y-2 mb-5">
          <div className="bg-status-gold-bg border border-brand-gold/25 rounded-panel px-4 py-3">
            <p className="text-status-gold-text text-sm font-medium">
              Meet at hotel lobby · 13:45
            </p>
          </div>
          <div className="bg-status-warn-bg border border-status-warn-text/20 rounded-panel px-4 py-3">
            <p className="text-status-warn-text text-sm font-medium">
              3 attendees missing hotel assignment
            </p>
          </div>
          <div className="bg-brand-red/8 border border-brand-red/20 rounded-panel px-4 py-3">
            <p className="text-brand-red text-sm font-medium">
              Flight LH 2031 status unknown
            </p>
          </div>
        </div>

        {/* Form inputs */}
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-2">Form inputs</p>
        <div className="bg-surface-card rounded-card border border-line p-4 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider block mb-1.5">
              Hotel name
            </label>
            <div className="border border-line rounded-panel px-3 py-2.5 bg-surface-page">
              <p className="text-sm text-ink">Marriott City Center Munich</p>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider block mb-1.5">
              Event
            </label>
            <div className="border border-line rounded-panel px-3 py-2.5 bg-surface-page flex justify-between items-center">
              <p className="text-sm text-ink-muted">Select event…</p>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider block mb-1.5">
              Notes
            </label>
            <div className="border border-line rounded-panel px-3 py-2.5 bg-surface-page min-h-[64px]">
              <p className="text-sm text-ink-muted">Add notes…</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPACING & RADIUS ───────────────────────────────────────────── */}
      <section className="px-4 mb-10">
        <h2 className="text-[11px] font-extrabold text-ink-muted tracking-widest uppercase mb-4">
          Spacing & Radius
        </h2>
        <div className="bg-surface-card rounded-card border border-line overflow-hidden">
          {[
            ["Page padding",       "px-4",          "16px horizontal"],
            ["Section gap",        "mb-8 / mb-5",   "Between major sections / components"],
            ["Card padding",       "px-4 py-3–4",   "Standard card internal padding"],
            ["Card radius (large)","rounded-card",  "All main cards — 16px"],
            ["Card radius (inner)","rounded-panel", "Callouts, inputs — 12px"],
            ["Pill radius",        "rounded-full",  "All pills and badges"],
            ["Card border",        "border-line",   "#E2E8F0"],
            ["Row divider",        "border-line-subtle", "#F1F5F9"],
          ].map(([name, token, note], i, arr) => (
            <div key={name} className={`px-4 py-3 flex justify-between items-start gap-4 ${i < arr.length - 1 ? "border-b border-line-subtle" : ""}`}>
              <div>
                <p className="text-sm text-ink">{name}</p>
                <p className="text-xs text-ink-muted mt-0.5">{note}</p>
              </div>
              <span className="text-xs font-mono text-ink-secondary shrink-0">{token}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── ICONS ──────────────────────────────────────────────────────── */}
      <section className="px-4 mb-10">
        <h2 className="text-[11px] font-extrabold text-ink-muted tracking-widest uppercase mb-4">
          Icons
        </h2>
        <div className="bg-surface-card rounded-card border border-line p-4">
          <p className="text-sm text-ink-secondary mb-3">
            Icons are drawn as inline SVGs (stroke-only, strokeWidth=2, strokeLinecap=round). Size: 24px in tab bar, 20px in list rows, 16px inline. Color inherits from parent text color unless overridden.
          </p>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Today", path: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
              { label: "People", path: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
              { label: "Move", path: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
              { label: "Hotel", path: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
              { label: "Plane", path: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></> },
              { label: "Bus", path: <><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></> },
              { label: "Back", path: <polyline points="15 18 9 12 15 6"/> },
              { label: "Edit", path: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></> },
              { label: "Phone", path: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.1-1.09a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></> },
              { label: "More", path: <><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></> },
            ].map(({ label, path }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-panel bg-surface-chip flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0C2340" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {path}
                  </svg>
                </div>
                <p className="text-[10px] text-ink-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
