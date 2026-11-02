# Assistant: one guess asks "Did you mean this one?"

Wording is chosen in `src/components/assistant/ResidentCandidates.tsx`, which already receives `candidates`, so the count was available with no matcher change. One candidate: `assistant.didYouMean` ("Did you mean this one?" / "คุณหมายถึงตัวนี้ใช่ไหม?"). Several: `whichOne`, unchanged.

Why this wording: the candidate card shows name, code, place and photo right below, so "this one" points at it and invites a yes; naming the resident in the sentence would duplicate the card.

Action (open question 7): one candidate renders one card button; pressing it is "yes". Question and control agree, no change needed.

Thai is Claude's own, unreviewed by a Thai speaker.
