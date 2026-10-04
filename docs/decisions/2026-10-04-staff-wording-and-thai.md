# 2026-10-04 — Staff wording and Thai: what was done for F-11, F-12, F-18, F-19

**Context.** Four findings from the staff dry run (#314), deferred four times.
The Director describes the 2IC as wanting "plain Thai first", so a Thai-mode
user meeting English, or a raw authentication error, is the role problem.

**F-12 — sign-in.** The action returned the auth service's `error.message`
("Invalid login credentials") and the form, being a `<form action>`, reset both
fields. It now returns the app's own wording (`login.errors.badCredentials`,
`signInFailed`, translated) for `error.code === "invalid_credentials"` and a
general "couldn't sign in just now" for any other refusal, and hands the email
back in the action state as the field's `defaultValue`. The password is
deliberately not returned.

**F-19 — validation: swap the words, keep the browser's checks.** The finding
asked for app-rendered messages and warned this might be a project. It is not,
if the goal is the language: `src/lib/i18n/validity.ts` is a form-level
`onInvalidCapture` that reads the control's `validity` (required, min/max,
length, type, pattern) and sets `setCustomValidity()` to the app's text in the
app's language, cleared on the next input so the browser re-checks. Spread onto
the `<form>` of Intake, Change password and Deliveries. What this does **not**
do: the bubble is still the browser's own widget (styling, position), and the
other forms still use the plain browser messages — adding `{...localizedValidity(t, locale)}`
to any other `<form>` is the whole change. Chosen over rendering our own inline
errors because that means rewriting each form's submit path, and Change
password's server-side current-password check (F-22) must not be disturbed.
Date limits are shown in the app's date format, not as the browser's locale
string.

**F-11 — Release notes and the Manual.** Chrome only: heading, intro, filter bar,
"Show everything", the Not released yet / Major / Nothing-for labels, role
names, dates, and the Manual's title, contents, roles heading, filter bar and
PDF links, each from the dictionary. A Thai reader now sees, in Thai, that the
note and manual *text* is English for now and who to ask. The notes' text and
the Manual's topics stay English: the Thai manual is its own backlog item. Not
done here: the public Foster, Volunteer, Donate, Home and Adopt texts (data,
filled at Management → Translations) and Thai names for immunization,
procedure and blood-test types (reference data). F-11 stays open for those.

**F-18 — developer's words.** The Dev/UAT tag on release notes is shown to
admins only (the role is the page's own `loadCurrentRole`). "Lifecycle" is
**data** — the system zone's key, matched by placement logic and the Drive
folder layout — so it is not renamed; `placeName()` shows it as "Status" /
"สถานะ" wherever no Thai name was entered. The assistant's note stamp is now
a dictionary string worded in the language of whoever confirmed it; rows saved
before this keep the English stamp. The adopter on a placement row reads
"Adopter: …" (the contact type Carer, which covers fosterers and adopters,
displays as "Foster or adopter"; the stored value is unchanged). Photo folder
names are labelled through a new `enums.photoFolder`; the stored/Drive names
stay English. The medication drop-down omits "(unit)" when the name already
contains the unit.
