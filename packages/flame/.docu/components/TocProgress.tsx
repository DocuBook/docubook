/**
 * Share of the page's sections the reader has reached, from 0 to 1: the
 * active heading's position in the table of contents. Reaching the end of
 * the page counts as done, since a short last section never scrolls up to
 * the anchor offset and so never becomes active.
 *
 * @param activeIndex index of the active heading in the TOC, or -1 above the first one
 * @param total number of TOC entries
 * @param atEnd whether the page is scrolled to its end
 */
export function tocProgress(activeIndex: number, total: number, atEnd: boolean): number {
  if (total <= 0) return 0;
  if (atEnd) return 1;
  return Math.min(1, Math.max(0, (activeIndex + 1) / total));
}

// 28px fits the 32px bar button and leaves room for a two-digit number inside.
const SIZE = 28;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

/**
 * Circular progress for the mobile TOC bar, drawn inline before the active
 * section's title, with the percentage inside the ring. The number has no
 * "%" sign, which would not fit. At 100 the ring becomes a filled disc with
 * a check. Decorative: the bar's button names the progress in text.
 */
export function TocProgressCircle({ value }: { value: number }) {
  const progress = Math.min(1, Math.max(0, value));
  const percent = Math.round(progress * 100);
  const common = {
    width: SIZE,
    height: SIZE,
    viewBox: `0 0 ${SIZE} ${SIZE}`,
    "aria-hidden": true as const,
    "data-toc-progress": percent,
    className: "shrink-0",
  };

  if (percent === 100) {
    return (
      <svg {...common}>
        <circle cx={CENTER} cy={CENTER} r={CENTER} className="fill-primary" />
        <path
          d="M8.5 14.5l4 4 7-8.5"
          fill="none"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-primary-content"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      {/* Only the ring turns to start at 12 o'clock; the number stays upright */}
      <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-base-content/15"
        />
        {/* No arc at 0. A flat cap keeps a partial arc from reading as a
            loading spinner. */}
        {progress > 0 && (
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="butt"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none"
          />
        )}
      </g>
      <text
        x={CENTER}
        y={CENTER}
        textAnchor="middle"
        dominantBaseline="central"
        className={
          percent === 0
            ? "fill-base-content/60 text-[10px] font-semibold tabular-nums"
            : "fill-base-content text-[10px] font-bold tabular-nums"
        }
      >
        {percent}
      </text>
    </svg>
  );
}
