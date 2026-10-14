# A zone tap on the overview opens its plan

- A tap (or Enter/Space) on a zone opens that zone's plan directly. A zone with no plan yet goes to `/enclosures?zone=<id>`. Enclosures and rooms still only select, so a fat finger never leaves a zone plan by accident.
- The occupancy card used to be the only place a zone's count showed. It now shows on the zone's shape on the overview (`count/capacity`), and above the plan once you are inside the zone. The card is gone for zones; it remains for enclosures and rooms.
- Each zone is still a focusable link. Its accessible name now says where it goes: `zoneAria` ends "Opens this zone's plan", and `zoneListAria` ("Opens its enclosures") is used for a zone without a plan. Both dictionaries.
- "← Shelter overview" sits above a zone plan whenever an overview exists; the plan buttons stay.
- The map already opens on the overview when one exists; unchanged.
- Drawing the zone outlines is not code: Admin → Facility map.
