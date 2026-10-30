-- consumer: src/lib/public-pages.ts
--
-- Adds 'page:shop' to the hide-keys site_content.hidden_public_pages accepts (0256), so the Director can switch
-- /shop (Shop for the shelter, 0285) off from Admin -> Website like any other public page. 0256 says it in its
-- own words: "Adding a page to the public site later means adding its key here". This is that, for /shop.
--
-- Additive and re-runnable: the constraint is dropped and re-added with 0256's whole list plus the one new key,
-- in 0256's own shape. Every value 0256 accepted is still accepted, so no stored row can fail it. Home, Privacy,
-- /r/, /e/ and anything unknown are still refused. Write, read and audit are unchanged (0256).
--
-- The app half reads the list from src/lib/public-pages.ts (hideableEntries()), which offers page:shop once
-- /shop has a PUBLIC_PAGES entry. Until that lands nothing offers the key, so applying this hides nothing.

alter table site_content drop constraint if exists site_content_hidden_public_pages_check;
alter table site_content add constraint site_content_hidden_public_pages_check
  check (hidden_public_pages <@ array[
    'page:adopt', 'page:adopt-international', 'page:foster', 'page:volunteer', 'page:donate', 'page:appeals',
    'page:friends', 'page:friends-join', 'page:desexing', 'page:our-work', 'page:about', 'page:shop',
    'section:adopt', 'section:get-involved', 'section:services'
  ]::text[]);

comment on column site_content.hidden_public_pages is
  'Public pages and menu sections hidden from visitors (0256, page:shop added by 0290): page:<key> or section:<key>. Empty = everything shown. Home and Privacy cannot be listed. Written under website.content; audited.';

notify pgrst, 'reload schema';
