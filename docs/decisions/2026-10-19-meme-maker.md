# Meme maker, stage 2 of the meme library (`meme-maker`)

2026-10-19. A phone-first maker at `/memes/make`, built on stage 1 (`2026-10-18-meme-library-app.md`). **No migration.**

## The refusal lives on the save path

A joke made from a dying animal's photograph, shared under the shelter's name, is what this feature could do wrong. So Medical photos are refused where the meme is saved, not where the photo is picked. The maker sends `sourceFileId` with the image to the existing `createMeme` action. The server reads that file's `attachments` rows and runs `checkMakerSource` (`src/lib/memes/maker-source.ts`). It refuses the file when any row is Medical (`isMedicalFolder`, the rule the profile-photo code uses), when the file is not a resident photo, or when a row is still waiting for approval. The tagged residents come from those rows, not from the request. The picker and the lightbox button also hide Medical photos, but they are convenience only. The refusal test (`maker-source.test.mjs`) was written first.

A request made by hand to `createMeme` without `sourceFileId` is the stage 1 upload, unchanged: any image, chosen by a person with the library at Edit.

## Canvas in the browser, not the server

The image is drawn on a canvas with Noto Sans Thai Bold, loaded from the data URI the PDFs already embed (`src/lib/archive/fonts/noto-sans-thai-bold.ts`), so no dependency was added. The browser shapes Thai text, so ำ and tone marks stack correctly (checked in Chrome with `น้ำ กำลัง ก๊ก ที่ ปู่ ญี่ปุ่น`). Drawing on the Worker would have meant a canvas or text-shaping library. The photo is read from the same-origin photo route, so the canvas is never tainted, and the original is only read.

Wrapping (`src/lib/memes/maker-layout.ts`) uses `Intl.Segmenter` for Thai word breaks. A word wider than the line is broken between graphemes, so a vowel or tone mark is never stranded at a line start. It is tested with a stub measure.

## Smaller choices

- Three styles (classic, caption bar, speech bubble), crops square, 4:5 and original, centred. No drag-to-reposition: the brief said to keep it quick on a phone.
- The shelter logo (`public/lca-logo.jpg`) is **on by default**, bottom-right, so a shared meme carries the shelter's name.
- The title defaults to the words on the picture, the caption (`caption_en`) to the same words joined with " / ", the tag to `meme maker`. All editable afterwards on the meme's Edit page.
- The in-maker picker offers a resident's approved JPEG, PNG or WebP photos outside Medical. HEIC is left out because browsers cannot draw it on a canvas.
- "Make a meme" appears in the photo lightbox only for a login holding `social.library` at Edit, on an approved, non-Medical photo.
