import type { CSSProperties, ReactNode } from "react";

type CardsMdxProps = {
  cols?: number;
  children?: ReactNode;
  style?: CSSProperties;
};

export function CardsMdx({ cols = 2, children, style }: CardsMdxProps) {
  const columnCount = Math.max(1, Math.min(4, cols));

  return (
    <div
      className="docubook-card-group"
      style={
        {
          "--docubook-card-group-template": `repeat(${columnCount}, minmax(240px, 1fr))`,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
