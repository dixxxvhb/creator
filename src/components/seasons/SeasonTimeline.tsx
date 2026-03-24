import { useRef, useState } from 'react';
import type { Competition } from '@/types';

interface SeasonTimelineProps {
  competitions: Competition[];
  seasonStart: string | null;
  seasonEnd: string | null;
  onSelectCompetition: (id: string) => void;
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

function formatShort(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = parseDate(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number | null): string {
  if (days == null || days < 0) return 'bg-accent-500';
  if (days <= 3) return 'bg-danger-500';
  if (days <= 14) return 'bg-warning-500';
  return 'bg-accent-500';
}

function urgencyDeadlineColor(days: number | null): string {
  if (days == null || days < 0) return 'bg-text-tertiary';
  if (days <= 3) return 'bg-danger-500';
  if (days <= 14) return 'bg-warning-500';
  return 'bg-text-tertiary';
}

export function SeasonTimeline({
  competitions,
  seasonStart,
  seasonEnd,
  onSelectCompetition,
}: SeasonTimelineProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    label: string;
    sub: string;
    side: 'left' | 'right';
  } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Build date range
  const compDates = competitions
    .map((c) => c.date)
    .filter(Boolean) as string[];
  const deadlineDates = competitions
    .map((c) => c.entry_deadline)
    .filter(Boolean) as string[];
  const allDates = [...compDates, ...deadlineDates];

  if (allDates.length === 0 && !seasonStart) {
    return (
      <div className="text-xs text-text-tertiary text-center py-4">
        Add competition dates to see the timeline.
      </div>
    );
  }

  const sorted = [...allDates].sort();
  const rangeStart = seasonStart
    ? parseDate(seasonStart)
    : parseDate(sorted[0]);
  const rangeEnd = seasonEnd
    ? parseDate(seasonEnd)
    : parseDate(sorted[sorted.length - 1]);

  // Pad by 2 days on each end so markers aren't flush against edges
  const paddedStart = new Date(rangeStart.getTime() - 2 * 24 * 60 * 60 * 1000);
  const paddedEnd = new Date(rangeEnd.getTime() + 2 * 24 * 60 * 60 * 1000);
  const totalMs = paddedEnd.getTime() - paddedStart.getTime();

  if (totalMs <= 0) {
    return (
      <div className="text-xs text-text-tertiary text-center py-4">
        Invalid date range.
      </div>
    );
  }

  function toPercent(dateStr: string): number {
    const d = parseDate(dateStr);
    return Math.max(0, Math.min(100, ((d.getTime() - paddedStart.getTime()) / totalMs) * 100));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayInRange =
    today.getTime() >= paddedStart.getTime() &&
    today.getTime() <= paddedEnd.getTime();
  const todayPct =
    ((today.getTime() - paddedStart.getTime()) / totalMs) * 100;

  function handleMarkerEnter(
    e: React.MouseEvent | React.TouchEvent,
    label: string,
    sub: string
  ) {
    const el = e.currentTarget as HTMLElement;
    const track = trackRef.current;
    if (!track) return;
    const elRect = el.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const relX = elRect.left - trackRect.left + elRect.width / 2;
    const side: 'left' | 'right' = relX > trackRect.width / 2 ? 'right' : 'left';
    setTooltip({ x: relX, label, sub, side });
  }

  function handleMarkerLeave() {
    setTooltip(null);
  }

  return (
    <div className="w-full select-none">
      {/* Date range labels */}
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-text-tertiary">
          {seasonStart ? formatShort(seasonStart) : compDates.length > 0 ? formatShort(compDates.sort()[0]) : ''}
        </span>
        <span className="text-[10px] text-text-tertiary">
          {seasonEnd ? formatShort(seasonEnd) : compDates.length > 0 ? formatShort([...compDates].sort().at(-1)!) : ''}
        </span>
      </div>

      {/* Track area */}
      <div ref={trackRef} className="relative" style={{ height: '64px' }}>
        {/* Center track */}
        <div
          className="absolute left-0 right-0 h-2 bg-surface-secondary rounded-full"
          style={{ top: '12px' }}
        />

        {/* Today line */}
        {todayInRange && (
          <div
            className="absolute w-0.5 bg-danger-500/60"
            style={{
              left: `${todayPct}%`,
              top: '4px',
              height: '32px',
              transform: 'translateX(-50%)',
            }}
            title="Today"
          />
        )}

        {/* Deadline markers (diamonds) */}
        {competitions.map((comp) => {
          if (!comp.entry_deadline) return null;
          const pct = toPercent(comp.entry_deadline);
          const days = daysUntil(comp.entry_deadline);
          const color = urgencyDeadlineColor(days);
          return (
            <div
              key={`dl-${comp.id}`}
              className={`absolute w-2.5 h-2.5 rotate-45 ${color} cursor-pointer transition-transform hover:scale-125`}
              style={{
                left: `${pct}%`,
                top: '9px',
                transform: `translateX(-50%) rotate(45deg)`,
              }}
              onMouseEnter={(e) =>
                handleMarkerEnter(
                  e,
                  `Deadline: ${comp.name}`,
                  formatShort(comp.entry_deadline!)
                )
              }
              onMouseLeave={handleMarkerLeave}
              onClick={() => onSelectCompetition(comp.id)}
            />
          );
        })}

        {/* Competition markers (circles) */}
        {competitions.map((comp) => {
          if (!comp.date) return null;
          const pct = toPercent(comp.date);
          const days = daysUntil(comp.date);
          const color = urgencyColor(days);
          const shortName = comp.name.length > 12 ? comp.name.slice(0, 11) + '…' : comp.name;
          return (
            <div
              key={`comp-${comp.id}`}
              className="absolute flex flex-col items-center"
              style={{ left: `${pct}%`, top: '6px', transform: 'translateX(-50%)' }}
            >
              <div
                className={`w-4 h-4 rounded-full ${color} border-2 border-surface-primary cursor-pointer transition-transform hover:scale-125 shadow`}
                onMouseEnter={(e) =>
                  handleMarkerEnter(
                    e,
                    comp.name,
                    [formatShort(comp.date!), comp.location].filter(Boolean).join(' · ')
                  )
                }
                onMouseLeave={handleMarkerLeave}
                onClick={() => onSelectCompetition(comp.id)}
              />
              <span
                className="text-[9px] text-text-secondary mt-1 whitespace-nowrap leading-none"
                style={{ maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {shortName}
              </span>
            </div>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-10 bg-surface-primary border border-border rounded-lg px-2.5 py-1.5 shadow-lg pointer-events-none"
            style={{
              top: '-8px',
              ...(tooltip.side === 'right'
                ? { right: `calc(100% - ${tooltip.x}px + 8px)` }
                : { left: `${tooltip.x + 8}px` }),
              minWidth: '120px',
              maxWidth: '200px',
            }}
          >
            <p className="text-xs font-semibold text-text-primary leading-snug">{tooltip.label}</p>
            {tooltip.sub && (
              <p className="text-[10px] text-text-secondary leading-snug mt-0.5">{tooltip.sub}</p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-accent-500 border border-surface-primary" />
          <span className="text-[10px] text-text-tertiary">Competition</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-text-tertiary rotate-45" />
          <span className="text-[10px] text-text-tertiary">Deadline</span>
        </div>
        {todayInRange && (
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3 bg-danger-500/60" />
            <span className="text-[10px] text-text-tertiary">Today</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-danger-500 border border-surface-primary" />
          <span className="text-[10px] text-text-tertiary">≤3 days</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-warning-500 border border-surface-primary" />
          <span className="text-[10px] text-text-tertiary">≤14 days</span>
        </div>
      </div>
    </div>
  );
}
