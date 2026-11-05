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

const SIZE = 18;
const STROKE = 2;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Circular progress for the mobile TOC bar, drawn inline before the active
 * section's title. Decorative: the bar's button names the progress in text.
 */
export function TocProgressCircle({ value }: { value: number }) {
  const progress = Math.min(1, Math.max(0, value));
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
      data-toc-progress={Math.round(progress * 100)}
      className="shrink-0 -rotate-90"
    >
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        fill="none"
        strokeWidth={STROKE}
        className="stroke-base-content/15"
      />
      {/* No arc at 0: a round cap would still draw a dot */}
      {progress > 0 && (
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none"
        />
      )}
    </svg>
  );
}
