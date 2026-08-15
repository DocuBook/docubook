"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type TooltipMdxProps = {
  /** Visible trigger text (dotted underline). */
  text?: ReactNode;
  /** Bubble content shown on hover/focus. */
  tip?: ReactNode;
};

const GAP = 10;
const EDGE = 8;

// Notched tail — an SVG quadratic Bézier path, computed (not hardcoded):
// the tail box is TAIL_SIZE wide and protrudes TAIL_PROTRUSION past the
// bubble edge. Two `Q` segments sweep from the shoulders to the tip, so the
// notch curves like a chat bubble instead of a triangle. The path lives in a
// 1px-padded viewBox so the 1px stroke is never clipped.
const TAIL_SIZE = 26;
const TAIL_PROTRUSION = 12;
const TAIL_PAD = 1;
const TAIL_TIP_X = TAIL_SIZE / 2;
const TAIL_W = TAIL_SIZE + TAIL_PAD * 2;
const TAIL_H = TAIL_PROTRUSION + TAIL_PAD * 2;

/**
 * Auto-positioned tooltip: the bubble is `position: fixed` and, on hover,
 * measured against the trigger and the window — it flips to the side with
 * more room and clamps to the viewport, so no `side` prop is needed.
 */
export function TooltipMdx({ text, tip }: TooltipMdxProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [bubbleStyle, setBubbleStyle] = useState<CSSProperties>({});
  const [tailStyle, setTailStyle] = useState<CSSProperties>({});
  const [below, setBelow] = useState(true);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !bubbleRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const bubble = bubbleRef.current.getBoundingClientRect();
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    // Chat-bubble geometry: align the bubble's edge with the trigger (not
    // center it) and hug the tail to the corner near the trigger. Flip
    // vertically to the side with more room; clamp to the window.
    const flip = viewH - trigger.bottom >= trigger.top;
    const rightOverflow = trigger.left + bubble.width > viewW - EDGE;
    const left = rightOverflow
      ? Math.max(EDGE, viewW - bubble.width - EDGE)
      : Math.min(Math.max(trigger.left, EDGE), viewW - bubble.width - EDGE);
    const top = flip
      ? Math.min(trigger.bottom + GAP, viewH - bubble.height - EDGE)
      : Math.max(trigger.top - GAP - bubble.height, EDGE);

    setBubbleStyle({ left, top });
    setBelow(flip);

    // Tail: horizontal center tracks the trigger; vertical edge depends on
    // the flip — bubble below trigger → tail at the TOP (tip up), bubble
    // above → tail at the BOTTOM (tip down). Overlap the body border by
    // TAIL_PAD + 1 (2px) so the tail fill fully covers the body's border at
    // the junction — with only 1px the border's outer half still shows
    // through as a separate line across the tail base.
    const tailCenter = trigger.left + trigger.width / 2 - left;
    setTailStyle({
      left: Math.min(Math.max(tailCenter - TAIL_SIZE / 2, 2), bubble.width - TAIL_SIZE - 2),
      top: flip ? -TAIL_PROTRUSION + TAIL_PAD + 1 : bubble.height - TAIL_PAD - 1,
    });
  }, [open]);

  const content = tip ?? "";
  const show = open && Boolean(content);
  const bubbleColor = "hsl(var(--card, 0 0% 100%))";
  const borderColor = "hsl(var(--border-color, 210 20% 85%))";

  // Quadratic Bézier tail path (tip points down when the bubble sits above
  // the trigger, up otherwise). OPEN path (no Z close) so the attachment edge
  // has no stroke: it sits under the bubble body, and only the curved sides
  // + tip carry the border stroke — otherwise the closing edge's 1px line
  // shows through at the bubble's border and collides with its rounding.
  // Control points sit at the midpoint of the shoulder→tip segment, pulled
  // INWARD (concave) so the notch reads as a chat-bubble tail, pinched
  // sharply from wide shoulders to a point.
  const tipY = TAIL_PROTRUSION + TAIL_PAD;
  const shoulderY = TAIL_PAD;
  const tipX = TAIL_TIP_X + TAIL_PAD;
  const midY = (shoulderY + tipY) / 2;
  const curveIn = 2.5; // inward pull (px) — concave notch
  const leftMid = (TAIL_PAD + tipX) / 2;
  const rightMid = (tipX + TAIL_SIZE + TAIL_PAD) / 2;
  const curveLeft = leftMid + curveIn;
  const curveRight = rightMid - curveIn;
  const rightX = TAIL_SIZE + TAIL_PAD;
  const tailPath = below
    ? `M ${TAIL_PAD} ${tipY} Q ${curveLeft} ${midY} ${tipX} ${shoulderY} Q ${curveRight} ${midY} ${rightX} ${tipY}`
    : `M ${TAIL_PAD} ${shoulderY} Q ${curveLeft} ${midY} ${tipX} ${tipY} Q ${curveRight} ${midY} ${rightX} ${shoulderY}`;

  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        ref={triggerRef}
        tabIndex={0}
        aria-describedby={id}
        style={{
          cursor: "help",
          color: "hsl(var(--primary, 210 81% 56%))",
          textDecorationLine: "underline",
          textDecorationStyle: "dotted",
          textDecorationColor: "hsl(var(--primary, 210 81% 56%))",
          textUnderlineOffset: "0.18em",
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        {text ?? "?"}
      </span>
      {show ? (
        <span
          ref={bubbleRef}
          role="tooltip"
          style={{ position: "fixed", ...bubbleStyle, zIndex: 9999 }}
        >
          {/* Body first, tail painted ON TOP — the tail's fill (same colour as
              the body) covers the body's border where they meet, so the bubble
              outline flows continuously into the notch instead of showing two
              separate borders. */}
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              maxWidth: "min(70vw, 22rem)",
              background: bubbleColor,
              color: "hsl(var(--foreground, 220 30% 15%))",
              border: `1px solid ${borderColor}`,
              borderRadius: 16,
              boxShadow: "0 8px 28px -6px rgb(0 0 0 / 0.18), 0 2px 8px -2px rgb(0 0 0 / 0.08)",
              padding: "0.5rem 0.9rem",
              fontSize: "0.8125rem",
              lineHeight: 1.5,
              overflowWrap: "anywhere",
            }}
          >
            {content}
          </span>
          <svg
            aria-hidden="true"
            width={TAIL_SIZE}
            height={TAIL_PROTRUSION}
            viewBox={`0 0 ${TAIL_W} ${TAIL_H}`}
            style={{ position: "absolute", ...tailStyle, display: "block" }}
          >
            <path d={tailPath} fill={bubbleColor} stroke={borderColor} strokeWidth={1} />
          </svg>
        </span>
      ) : null}
    </span>
  );
}
