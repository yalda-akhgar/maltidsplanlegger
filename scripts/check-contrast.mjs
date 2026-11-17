// Checks WCAG 2.2 AA contrast for the design tokens in src/index.css,
// in both light and dark theme.
// Run: node scripts/check-contrast.mjs   (exits with code 1 if any pair fails)
//
// Text needs 4.5:1. Non-text UI (borders of inputs, switch tracks, focus
// rings, meaningful icons) needs 3:1 (WCAG 1.4.11).

import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

function tokens(selector) {
  const block = css.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`))[1]
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]))
}

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const channel = (c) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const luminance = (rgb) => 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
/** Colour `fg` at `alpha` opacity painted over `bg`. */
const mix = (fg, alpha, bg) => fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)))

// [description, foreground, background, minimum, optional alpha of the background over --card]
const PAIRS = [
  ['Body text', 'foreground', 'background', 4.5],
  ['Text on cards / sheets', 'foreground', 'card', 4.5],
  ['Muted text on page', 'muted-foreground', 'background', 4.5],
  ['Muted text on cards', 'muted-foreground', 'card', 4.5],
  ['Muted text on muted', 'muted-foreground', 'muted', 4.5],
  ['Muted text on secondary (install card)', 'muted-foreground', 'secondary', 4.5],
  ['Button text on primary', 'primary-foreground', 'primary', 4.5],
  ['Button text on primary hover', 'primary-foreground', 'primary-dark', 4.5],
  ['Secondary button / badge', 'secondary-foreground', 'secondary', 4.5],
  ['Accent text', 'accent-foreground', 'accent', 4.5],
  ['Purple text on page', 'primary-text', 'background', 4.5],
  ['Purple text on cards', 'primary-text', 'card', 4.5],
  ['Purple text on accent (active nav)', 'primary-text', 'accent', 4.5],
  ['Sidebar active item', 'sidebar-accent-foreground', 'sidebar-accent', 4.5],
  ['Sidebar muted item', 'muted-foreground', 'sidebar', 4.5],
  ['Toast text (inverted)', 'background', 'foreground', 4.5],
  ['Destructive text on card', 'destructive', 'card', 4.5],
  ['Destructive text on its 10% tint', 'destructive', 'destructive', 4.5, 0.1],
  ['Input / switch border vs card', 'input', 'card', 3],
  ['Input / switch border vs page', 'input', 'background', 3],
  ['Focus ring vs page', 'ring', 'background', 3],
  ['Focus ring vs card', 'ring', 'card', 3],
  ['Primary fill vs page (selected chip)', 'primary', 'background', 3],
  ['On-target label', 'success-foreground', 'success', 4.5],
  ['Under-target label / plan note', 'warning-foreground', 'warning', 4.5],
  ['Success text on card', 'success-foreground', 'card', 4.5],
  ['Warning text on card', 'warning-foreground', 'card', 4.5],
]

let failures = 0
for (const [theme, selector] of [
  ['light', ':root'],
  ['dark', '.dark'],
]) {
  const t = { ...tokens(':root'), ...(selector === '.dark' ? tokens('.dark') : {}) }
  console.log(`\n${theme.toUpperCase()}`)
  for (const [label, fgKey, bgKey, min, alpha] of PAIRS) {
    const fg = hexToRgb(t[fgKey])
    const bg = alpha ? mix(hexToRgb(t[bgKey]), alpha, hexToRgb(t.card)) : hexToRgb(t[bgKey])
    const ratio = contrast(fg, bg)
    const ok = ratio >= min
    if (!ok) failures++
    console.log(`${ok ? '  ok ' : 'FAIL '} ${ratio.toFixed(2).padStart(5)} (min ${min})  ${label}  [${fgKey} on ${bgKey}]`)
  }
}
console.log(failures ? `\n${failures} pair(s) below WCAG AA.` : '\nAll pairs meet WCAG AA.')
process.exit(failures ? 1 : 0)
