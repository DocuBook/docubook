/**
 * The two card layouts as Takumi node trees. Page text only ever lands in
 * `text` nodes, so frontmatter is drawn as text and never parsed as markup.
 */

import type { Node } from "@takumi-rs/core";
import type { Card } from "./cards";
import type { Layout } from "./options";

export const WIDTH = 1200;
export const HEIGHT = 630;

/** Theme colours as flame's presets store them: HSL triplets such as `210 81% 56%`. */
export interface Palette {
  background: string;
  foreground: string;
  primary: string;
  muted: string;
  border: string;
}

export interface Brand {
  siteName: string;
  domain: string | undefined;
  /** Logo bytes (SVG, PNG, JPEG or WebP), or none. */
  logo: Uint8Array | undefined;
  palette: Palette;
  /** CSS font-family stack: configured fonts, then Geist. */
  fontFamily: string;
}

/** CSS declarations a Takumi node accepts. */
type Style = NonNullable<Node["style"]>;

const hsl = (triplet: string, alpha?: number): string =>
  alpha === undefined ? `hsl(${triplet})` : `hsl(${triplet} / ${alpha})`;

const box = (style: Style, children: Node[] = []): Node => ({
  type: "container",
  style,
  children,
});

const label = (value: string, style: Style): Node => ({
  type: "text",
  text: value,
  style,
});

/** Two lines at most, then an ellipsis. */
const clamp: Style = { lineClamp: 2, textOverflow: "ellipsis", overflow: "hidden" };

function logoImage(brand: Brand, size: number, radius = 0): Node[] {
  if (!brand.logo) return [];
  return [
    {
      type: "image",
      src: brand.logo,
      width: size,
      height: size,
      style: { width: size, height: size, borderRadius: radius, objectFit: "contain" },
    },
  ];
}

function identityRow(card: Card, brand: Brand, fontSize: number): Node {
  const { palette } = brand;
  return box(
    { display: "flex", alignItems: "center", gap: 18, fontSize, color: hsl(palette.muted) },
    [
      ...logoImage(brand, 56, 14),
      label(brand.siteName, { fontWeight: 600, color: hsl(palette.foreground) }),
      ...(card.section ? [label("›", { opacity: 0.6 }), label(card.section, {})] : []),
    ]
  );
}

function textBlock(card: Card, brand: Brand, maxWidth: number): Node {
  return box({ display: "flex", flexDirection: "column", gap: 22, maxWidth }, [
    label(card.title, {
      fontSize: 64,
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: -1.5,
      color: hsl(brand.palette.foreground),
      ...clamp,
    }),
    ...(card.description
      ? [
          label(card.description, {
            fontSize: 30,
            lineHeight: 1.35,
            color: hsl(brand.palette.muted),
            ...clamp,
          }),
        ]
      : []),
  ]);
}

/**
 * Default layout: identity row, title, description, a page-kind chip with the
 * domain, the logo in a tinted tile on the right, and a brand bar along the
 * bottom edge over a faint grid.
 */
function cardLayout(card: Card, brand: Brand): Node {
  const { palette } = brand;
  const kind = card.kind === "home" ? "Home" : "Docs";
  return box(
    {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: hsl(palette.background),
      color: hsl(palette.foreground),
      fontFamily: brand.fontFamily,
    },
    [
      box({
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `linear-gradient(${hsl(palette.border)} 1px, transparent 1px), linear-gradient(90deg, ${hsl(palette.border)} 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
        opacity: 0.45,
      }),
      box({
        position: "absolute",
        top: -220,
        right: -160,
        width: 720,
        height: 720,
        borderRadius: 9999,
        backgroundImage: `radial-gradient(circle, ${hsl(palette.primary, 0.2)} 0%, ${hsl(palette.primary, 0)} 65%)`,
      }),
      box(
        {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGrow: 1,
          position: "relative",
          padding: "72px 80px 60px 80px",
        },
        [
          identityRow(card, brand, 28),
          // Leave a 60 px gap before the logo tile, which starts at x = 900.
          textBlock(card, brand, brand.logo ? 760 : 1040),
          box(
            {
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontSize: 24,
              color: hsl(palette.muted),
            },
            [
              box(
                {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 18px",
                  borderRadius: 9999,
                  backgroundColor: hsl(palette.primary, 0.1),
                  color: hsl(palette.primary),
                  fontWeight: 600,
                },
                [
                  box({
                    width: 10,
                    height: 10,
                    borderRadius: 9999,
                    backgroundColor: hsl(palette.primary),
                  }),
                  label(kind, {}),
                ]
              ),
              ...(brand.domain ? [label(brand.domain, {})] : []),
            ]
          ),
        ]
      ),
      ...(brand.logo
        ? [
            box(
              {
                position: "absolute",
                right: 80,
                top: 200,
                width: 220,
                height: 220,
                borderRadius: 48,
                backgroundColor: hsl(palette.primary, 0.08),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
              logoImage(brand, 140)
            ),
          ]
        : []),
      box({ height: 12, flexShrink: 0, backgroundColor: hsl(palette.primary) }),
    ]
  );
}

/** Plain layout: identity row, title, description, domain. Safe for square crops. */
function minimalLayout(card: Card, brand: Brand): Node {
  const { palette } = brand;
  return box(
    {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      width: WIDTH,
      height: HEIGHT,
      padding: 80,
      backgroundColor: hsl(palette.background),
      color: hsl(palette.foreground),
      fontFamily: brand.fontFamily,
    },
    [
      box({ display: "flex", alignItems: "center", gap: 18, fontSize: 28 }, [
        ...logoImage(brand, 56, 14),
        label(brand.siteName, { fontWeight: 600 }),
      ]),
      textBlock(card, brand, 980),
      label(brand.domain ?? "", { fontSize: 24, color: hsl(palette.muted) }),
    ]
  );
}

export function buildTree(layout: Layout, card: Card, brand: Brand): Node {
  return layout === "minimal" ? minimalLayout(card, brand) : cardLayout(card, brand);
}
