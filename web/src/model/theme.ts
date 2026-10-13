// Colors. Same formula as the Mac app's Theme.swift: related fears share a hue family,
// shades differ in hue, saturation and brightness, tuned separately for light and dark.
import { families, fears, sources } from "./content";
import type { FearId, SourceId } from "./types";

type Scheme = "light" | "dark";

export function hsb(hue: number, shade: number, scheme: Scheme, saturationScale = 1): string {
  const s = Math.max(0, Math.min(2, shade));
  const hueOffset = [-0.025, 0, 0.025][s];
  const pick = scheme === "dark"
    ? { sat: [0.45, 0.60, 0.75][s], bri: [1.0, 0.85, 0.70][s] }
    : { sat: [0.85, 0.70, 0.60][s], bri: [0.50, 0.66, 0.82][s] };
  let h = hue + hueOffset;
  if (h < 0) h += 1;
  if (h > 1) h -= 1;
  return hsbToHsl(h, pick.sat * saturationScale, pick.bri);
}

/** HSB (what SwiftUI uses) to a CSS hsl() string. */
export function hsbToHsl(h: number, s: number, b: number): string {
  const l = b * (1 - s / 2);
  const sl = l === 0 || l === 1 ? 0 : (b - l) / Math.min(l, 1 - l);
  return `hsl(${(h * 360).toFixed(1)} ${(sl * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`;
}

const sourceHue = { people: 0.93, events: 0.14, unknown: 0 };

export function fearColor(id: FearId, scheme: Scheme): string {
  const info = fears.find((f) => f.id === id)!;
  return hsb(families.find((f) => f.id === info.family)!.hue, info.shade, scheme);
}

export function sourceColor(id: SourceId, scheme: Scheme): string {
  const source = sources.find((s) => s.id === id)!;
  if (source.group === "unknown") return hsb(0, 1, scheme, 0);
  return hsb(sourceHue[source.group], source.shade, scheme);
}

/** CSS custom properties for every fear, family and source, for light and dark. */
export function themeCss(): string {
  const vars = (scheme: Scheme) => [
    ...fears.map((f) => `--fear-${f.id}: ${fearColor(f.id, scheme)};`),
    ...families.map((f) => `--family-${f.id}: ${hsb(f.hue, 1, scheme)};`),
    ...sources.map((s) => `--source-${s.id}: ${sourceColor(s.id, scheme)};`),
  ].join("\n  ");
  return `:root {\n  ${vars("light")}\n}
@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n  ${vars("dark")}\n  }\n}
:root[data-theme="dark"] {\n  ${vars("dark")}\n}`;
}
