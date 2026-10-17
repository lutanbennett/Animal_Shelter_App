# Add Shelter Photo: a card, not a rule in the tile code

**Cause (found by reading, 2026-10-17).** The brief's candidates were all about the old derived home. Since cards
(0194) a role that holds cards gets exactly those cards' tiles (`cardTilesFor`) and nothing else; Admin's phone home
is Management's home (`/home/management`). No card opened `/photos/add`, so no role could be given the tile in
Settings, and the only tile the page ever had was the "extra" for roles with jobs and no medical-photos job (the
`jobs.length > 0` branch). Admin, Management and Volunteer have no jobs, so none of them ever saw it. Permissions were
never the blocker (`/photos/add` and `/medical/photos` share `photos.resident_add`).

**Choice: widened, not special-cased, and it is a card.** The brief asked for "any role holding
`photos.resident_add` gets the tile". Under cards that rule would draw a tile nobody chose, on top of curated
homes, and `check-home-cards.mjs` rejects any tile that is not a held card. The general form that fits is card
twenty-two, `add_photos` (bundle: `photos.resident_add` only, opens `/photos/add`). Ticking it on a role in
Settings grants the activity *and* draws the tile in one step, so Lutan's tick on Volunteer cannot grant the right
and draw nothing. No role key is named anywhere. The old jobs-branch extra is unchanged and now carries the new
label.

**What it does not touch.** The page's folder rules (Shelter default, Medical only for a login that may use it),
`ResidentPicker`, the tagging path, `JOBS_OF_ROLE`, and every role's grants. Migration: none. Existing roles' cards
are unchanged, so no home changes until someone ticks the card.

**Wording (proposal, Lutan to say yes/no).** Card, tile and route label: **Add Shelter Photo** / Thai
**เพิ่มรูปศูนย์**, to sit beside "Add Medical Photos". The page's own heading stays "Add photos".

**Still Lutan's.** Ticking Add Shelter Photo onto Volunteer (and Management, which is what Admin's phone shows) in
Settings → Who does what. Until he does, no volunteer has the card; the release note says only that it can now be given.

**Added mid-build, Lutan's words 2026-10-17: Shelter is the only folder** on this page ("No medical, foster or adoption"),
and the button is **Add Shelter Photo**, "separate to the add medical photo". `/photos/add` now offers Shelter and
nothing else; a login the server does not allow Shelter sees a sentence instead of the flow.

**Open question for Lutan (not settled by this PR).** The server lets a login with only `photos.resident_add` file into
Medical alone; Shelter (and Foster, Adoption) need `photos.resident_publish` as well (`photoCategoriesFor`). So a role
given just this card sees "Your role cannot add Shelter photos yet" until either (a) the server is changed so Add photos
alone allows Shelter, or (b) Publish photos is ticked too. (a) widens what a volunteer may do, and a Shelter photo can
become a resident's profile photo, which is public, so it was not done without his say-so. Lutan was asked and did not choose.
