# The as-built document (#s54mf)

2026-11-13, `claude/asbuilt-hardware-stack`. Documentation only: no code, schema or migration.

## What was decided

- **One dated document, `docs/as-built-2026-11-13.md`**, with the date in the filename so it cannot read
  as live. Every section opens with how its lines were read, and every security statement carries one of
  three marks: in place, intended not built, not established. The marks are the deliverable.
- **Diagrams are Mermaid in the markdown**, never images, so they diff and cannot go quietly stale.
- **The write-rule (`#1wf15`) governed every line**: meaning in the repo, values on Lutan's Desktop. No
  address, hardware address, model number, network name, tunnel or account id, and not the outside port
  of the one inbound rule. Counts replace tables. The document's last section names the four Desktop files.
- **Not a rewrite of `docs/architecture-review-2026-09-22.md`**, which reviews the code. The as-built
  records what exists and cites the review.

## What it found

The assistant's model path (`#z04wr`) was measured on 2026-10-30, before the Pi moved behind the VPN
router on 2026-11-01. The router's rule now stops the Pi starting connections to the home network, which
is what a call to a model machine is, and the runbook's firewall step names the Pi by its old address.
As documented the path cannot work without a deliberate router exception, which would be a hole in the
containment. Nobody has tested it since the move. Recorded in the document (section 8) and for the
planner; no backlog item was edited beyond `#s54mf`.

## Not done

Nothing re-read on the Pi, the router or any console, and no production read: the document says which
readings are dated and which are not established.
