# Staff can preview a merch product's photo before it is public (#w9xpq)

Migration `0380` adds one branch to `can_see_drive_file()`: `merch_products.photo_drive_file_id`, gated on
`has_permission('merch.manage', 'edit')`. That is the activity `/api/merch/photos` asks (`src/app/api/merch/photos/route.ts:25`)
and the product form follows, so whoever may upload a photo may see it, and nobody else. No card added, no role named, Admin unchanged.
The function stays `security invoker`, so `merch_products`' own select policy (`merch.manage` read) also applies.

Checked on dev (port 3002):
- Login holding only `run_merch_shop`: uploaded a photo on the hidden "Proof mug (dev)" and saved; the preview rendered (160x107,
  HTTP 200 from `/api/photos/<id>`). Pressing Show then put the product and its photo on the public `/shop/merch` page.
- Login holding only `view_residents`: the same photo URL returned 404.

#1591's outstanding press (product save and public display) is now done: both worked.
Nothing was broken for users before; the preview used to hide itself.
