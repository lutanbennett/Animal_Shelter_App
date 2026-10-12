// Lets `node --test` import the app's TypeScript modules as they are written.
// Loaded with `--import` (see `npm test`). Test-only: nothing here ships.
import { register } from "node:module";
register("./resolve-hooks.mjs", import.meta.url);
