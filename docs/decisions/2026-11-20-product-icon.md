# 2026-11-20 — The product has a mark of its own, and it is not a shelter's logo

## What changed

`src/app/layout.tsx` served `/lca-logo.jpg` as the icon for every page. That is **one shelter's
photograph**, so every browser tab, bookmark and phone home screen wore Lanna's logo — including
on `cooperjaidee.org`, and including for any other shelter the platform now serves. It predates
multi-tenancy and nobody noticed when tenancy arrived.

The icon is now the product's own mark: a collar tag with a heart cut out of it.

## Why a tag

Lutan chose it from six proposals (the canvas is his; it is not in the repo). The reasoning worth
keeping:

- **It is what the product does.** A collar tag is the thing that says who an animal is and that
  somebody is keeping track of them. That is the software, not a picture of the animals.
- **It carries the name.** *Jaidee* (ใจดี) is Thai for kind-hearted — literally *good heart* — so
  the heart is the name rather than decoration.
- **It survives being small.** A browser tab is 16 px. The marks that lost at that size were the
  ones carrying a second idea inside them.
- **It ages into other shelters.** The platform is multi-tenant now. A mark that says *record
  keeping* travels to a shelter that keeps cats; a particular dog's face does not.

**The poodle is not retired.** `PuppyLoader.tsx` keeps the loading screens and the empty-photo
placeholders. A mark and an illustration do different jobs and a product may have both.

## How the files relate

`public/cooper-jaidee-icon.svg` is the **source**. The PNGs were rasterised from that exact file by
Chrome, so a bitmap cannot drift from the vector; re-render rather than hand-edit a PNG. There are
three SVGs because a mark needs three versions and only three: full colour, a version for dark
backgrounds (the ring goes pale or it disappears), and one colour with the heart as a real hole
(`fill-rule: evenodd`) for a stamp, a shirt or a form.

## Found, not fixed

**The icon is still one value for every shelter.** This change replaces a shelter's logo with the
product's, which is right for a browser tab — a tab shows the product. But if a shelter ever wants
its own favicon on its own address, that is a per-shelter setting and nothing here provides one. It
is not a regression: before today it was Lanna's photograph for everybody, which was worse.

**The mark below about 20 px loses its ring.** It is a thin open circle, and thin open circles are
the first casualty of a small raster. The fix, if a bookmark list ever looks like a plain amber
blob, is a 16 px variant with a thicker ring — not a different mark.

## Not in this change

The Google consent screen (`#gcnst`) needs a square PNG logo, which Google will not take as SVG;
two were rendered to Lutan's Desktop rather than committed, because they are an upload he makes by
hand and nothing in the app serves them.
