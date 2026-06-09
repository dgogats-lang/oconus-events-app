'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MovementMode } from '@prisma/client';

// ─── types ───────────────────────────────────────────────────────────────────

export type SerializedMovement = {
  id: string;
  name: string;
  mode: MovementMode;
  departureTime: string;
  arrivalTime: string | null;
  departureLocation: string;
  arrivalLocation: string;
  meetTime: string | null;
  meetLocation: string | null;
  notes: string | null;
  paxCount: number;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const MODE_LABEL: Record<MovementMode, string> = {
  BUS: 'Bus', CAR: 'Car', FLIGHT: 'Flight', TRAIN: 'Train', WALK: 'Walk', OTHER: 'Transfer',
};

function fmtTime(iso: string | null | undefined) {
  if (!iso) return '—';
  // timeZone: "UTC" forces display of the stored UTC value, which is the
  // correct dumb-local wall-clock time (DEC-020). Without this, client-side
  // rendering would convert to the viewer's device timezone.
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function fmtDuration(dep: string, arr: string | null | undefined) {
  if (!arr) return null;
  const mins = Math.round((new Date(arr).getTime() - new Date(dep).getTime()) / 60000);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── card content ─────────────────────────────────────────────────────────────

function MovementCard({ m, isNext }: { m: SerializedMovement; isNext: boolean }) {
  const duration = fmtDuration(m.departureTime, m.arrivalTime);
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg">
      {/* Dark header */}
      <div className="bg-[#0C2340] px-4 pt-3.5 pb-4">
        {/* Eyebrow + pill */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider">
            {isNext ? 'Next movement' : fmtShortDate(m.departureTime)}
          </span>
          <div
            className="flex items-center rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <span
              className="text-[10px] font-semibold text-blue-200 px-2.5 py-1 border-r"
              style={{ borderColor: 'rgba(255,255,255,0.15)' }}
            >
              {MODE_LABEL[m.mode]}
            </span>
            <span className="text-[10px] font-semibold text-blue-200 px-2.5 py-1 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {m.paxCount} pax
            </span>
          </div>
        </div>

        {/* Name */}
        <p className="text-[15px] font-semibold text-white mb-2.5 leading-snug">{m.name}</p>

        {/* Stat columns */}
        <div className="flex items-start gap-4">
          {(m.meetTime || m.meetLocation) && (
            <>
              <div className="shrink-0">
                <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1">Meet</p>
                <p className="text-[20px] font-semibold text-white leading-none">{fmtTime(m.meetTime)}</p>
                {m.meetLocation && (
                  <p className="text-[11px] text-blue-300 mt-0.5 truncate max-w-[80px]">{m.meetLocation}</p>
                )}
              </div>
              <div className="w-px self-stretch mt-1" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </>
          )}
          <div className="shrink-0">
            <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1">Departs</p>
            <p className="text-[20px] font-semibold text-white leading-none">{fmtTime(m.departureTime)}</p>
            <p className="text-[11px] text-blue-300 mt-0.5">{fmtShortDate(m.departureTime)}</p>
          </div>
          {duration && (
            <>
              <div className="w-px self-stretch mt-1" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <div className="shrink-0">
                <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1">Duration</p>
                <p className="text-[20px] font-semibold text-white leading-none">{duration}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* White lower section */}
      <div className="bg-white px-4 pt-3 pb-3">
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full border-2 border-gray-400 bg-white shrink-0" />
              <p className="text-sm text-gray-800 truncate">{m.departureLocation}</p>
            </div>
            <p className="text-xs text-gray-400 shrink-0">{fmtTime(m.departureTime)}</p>
          </div>
          <div className="flex gap-2 py-0.5 ml-[3px]">
            <div className="w-px h-3 bg-gray-200 ml-[3px]" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-gray-700 shrink-0" />
              <p className="text-sm text-gray-800 truncate">{m.arrivalLocation}</p>
            </div>
            {m.arrivalTime && (
              <p className="text-xs text-gray-400 shrink-0">{fmtTime(m.arrivalTime)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── card stack ───────────────────────────────────────────────────────────────

export function MovementCardStack({ movements }: { movements: SerializedMovement[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const cardCount = movements.length;

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || cardCount === 0) return;

    // Mirror the CardStack/VisibleCard logic from the original, inline.
    let active = 0;

    function progress() {
      const { scrollLeft, scrollWidth, clientWidth } = scroll!;
      return scrollWidth === clientWidth ? 0 : scrollLeft / (scrollWidth - clientWidth);
    }

    function updateCards(p: number) {
      const relPerCard = cardCount > 1 ? 1 / (cardCount - 1) : 1;

      cardRefs.current.forEach((el, i) => {
        if (!el) return;

        const cardStart = relPerCard * i;
        const csp = cardCount > 1 ? (p - cardStart) / relPerCard : 0; // cardScrollProgress
        const absCsp = Math.abs(csp);
        const acsp = cardCount > 1 ? p / relPerCard - active : 0; // activeCardScrollProgress
        const absAcsp = Math.abs(acsp);
        const dist = Math.abs(active - i);

        // translateX
        let tx = 0;
        if (active === i) {
          if (absCsp < 0.5) {
            tx = -128 * csp;
          } else {
            tx = -128 * Math.sign(csp) + 128 * csp;
            tx += -((1 - absCsp / cardCount / 4) * 10) * (absCsp - 0.5) * 2 * Math.sign(csp);
          }
        } else {
          tx = csp * -((1 - absCsp / cardCount / 4) * 10);
        }

        // translateZ — negative so cards behind appear smaller (not larger)
        const tz = -absCsp * 40;

        // rotateY
        let ry = 0;
        if (absAcsp < 0.5) {
          ry = absAcsp * -75;
        } else {
          ry = (1 - absAcsp) * -75;
        }
        if (i === active) {
          ry = absCsp < 0.5 ? absCsp * -90 : (1 - absCsp) * -90;
        }
        ry *= Math.sign(acsp) * (1 - dist / cardCount);

        // rotateZ, scale, zIndex, opacity
        const rz = csp * 2 * -1;

        let scale = 1 - absCsp * 0.05;
        if (i === active) scale -= absCsp < 0.5 ? absCsp * 0.25 : (1 - absCsp) * 0.25;
        scale = Math.max(0, scale);

        let z = cardCount - dist;
        const sign = Math.sign(acsp);
        if (sign === -1 && i < active) { z += 1; if (acsp < -0.5) z += 1; }
        if (sign === 1) {
          if (i === active) z += 1;
          if (i > active) { z += 1; if (acsp > 0.5) z += 1; }
        }

        const opacity = Math.min(1, Math.max(0, 5 - absCsp));

        el.style.transform = `translateX(${tx - 50}%) translateY(-50%) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`;
        el.style.zIndex = String(z);
        el.style.opacity = String(opacity);
      });
    }

    function onScroll() {
      const p = progress();
      const relPerCard = cardCount > 1 ? 1 / (cardCount - 1) : 1;

      if (p <= relPerCard * (active - 1) && active > 0) {
        active--;
        setActiveIndex(active);
      } else if (p >= relPerCard * (active + 1) && active < cardCount - 1) {
        active++;
        setActiveIndex(active);
      }

      updateCards(p);
    }

    updateCards(0);
    scroll.addEventListener('scroll', onScroll, { passive: true });
    return () => scroll.removeEventListener('scroll', onScroll);
  }, [cardCount]);

  if (cardCount === 0) return null;

  // Single movement: render plain (no stack)
  if (cardCount === 1) {
    return (
      <button
        className="w-full text-left rounded-2xl shadow-sm overflow-hidden active:opacity-90"
        onClick={() => router.push(`/movements/${movements[0].id}`)}
      >
        <MovementCard m={movements[0]} isNext />
      </button>
    );
  }

  return (
    <div className="rounded-2xl shadow-sm">
      {/* Stack area — no overflow:hidden so perspective isn't clipped */}
      <div style={{ position: 'relative', height: '230px' }}>

        {/* Invisible scroll container — captures horizontal swipe gestures */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            overflowX: 'scroll',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            position: 'absolute',
            inset: 0,
            zIndex: 10,
          }}
        >
          {movements.map((m, i) => (
            <div
              key={m.id}
              style={{
                flex: '1 0 100%',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
              onClick={() => {
                if (i === activeIndex) router.push(`/movements/${m.id}`);
              }}
            />
          ))}
        </div>

        {/* Visible cards — rendered on top via absolute positioning, pointer-events disabled */}
        <div
          style={{
            perspective: '800px',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          {movements.map((m, i) => (
            <div
              key={m.id}
              ref={(el) => { cardRefs.current[i] = el; }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '92%',
                height: 'calc(100% - 16px)',
                transform: 'translateX(-50%) translateY(-50%)',
                transformStyle: 'preserve-3d',
                pointerEvents: 'none',
              }}
            >
              <MovementCard m={m} isNext={i === 0} />
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div
        className="flex justify-center items-center gap-1.5 py-2.5"
        style={{ background: 'rgba(12,35,64,0.06)', borderRadius: '0 0 16px 16px' }}
      >
        {movements.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === activeIndex ? 16 : 6,
              height: 6,
              background: i === activeIndex ? '#0C2340' : '#CBD5E1',
            }}
          />
        ))}
      </div>
    </div>
  );
}
