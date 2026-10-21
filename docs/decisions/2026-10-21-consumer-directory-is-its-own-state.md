# A directory in a `-- consumer:` header is reported as its own state

**Decided 2026-10-21 (stream `consumer-header-directories`).**

`consumerState` compared `git show <ref>:<path>`. For a directory that prints a tree listing whose first line contains the ref, so two refs always differ, and the listing holds only names, so an edited file would still read live. A declared directory (a path ending `/`) now returns `directory` and warns "is a directory, which this check cannot compare (declare the files under it...)".

Chosen over resolving the directory to its files: that needs `git ls-tree` at the call site (`read` returns text only) and widens the change; the honest-state option keeps the signal and fixes both wrong directions. Not made silent, and nothing is inferred from SQL (see 2026-10-02-migration-consumer-header.md).

Reported, not fixed: other scripts may use `git show <ref>:<path>` the same way; not swept.
