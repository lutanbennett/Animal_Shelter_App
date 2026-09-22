/**
 * A drop-in for `yoga-layout/load`, the entry @react-pdf/layout uses to get
 * its flexbox engine, that works on Cloudflare Workers.
 *
 * yoga-layout ships its WebAssembly as a base64 string inside Emscripten
 * glue and instantiates it from bytes at runtime. workerd forbids that
 * ("Wasm code generation disallowed by embedder"): a Worker may only run
 * WebAssembly that arrived as a module in the deployed bundle. So the same
 * binary lives beside this file as yoga.wasm (scripts/extract-yoga-wasm.mjs
 * pulls it out of the glue — rerun it whenever yoga-layout is upgraded),
 * Turbopack's `?module` import hands it over pre-compiled, and Emscripten's
 * `instantiateWasm` hook lets the untouched glue wire it up instead of
 * compiling its own copy. next.config.ts aliases `yoga-layout/load` here.
 *
 * Both dependencies below sit outside yoga-layout's exports map, hence the
 * relative paths into node_modules.
 */
// @ts-expect-error Emscripten glue ships without types.
import createYogaModule from "../../../../node_modules/yoga-layout/dist/binaries/yoga-wasm-base64-esm.js";
import wrapAssembly from "../../../../node_modules/yoga-layout/dist/src/wrapAssembly.js";
import yogaWasm from "./yoga.wasm?module";

export * from "../../../../node_modules/yoga-layout/dist/src/generated/YGEnums.js";

export async function loadYoga() {
  const lib = await createYogaModule({
    instantiateWasm(
      imports: WebAssembly.Imports,
      receive: (instance: WebAssembly.Instance) => void,
    ) {
      WebAssembly.instantiate(yogaWasm, imports).then(receive);
      return {};
    },
  });
  return wrapAssembly(lib);
}
