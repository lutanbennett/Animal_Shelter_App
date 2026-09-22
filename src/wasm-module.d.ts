// Turbopack's `?module` import of a .wasm file: the compiled module, not an
// instance. Used by src/lib/archive/yoga/load.ts.
declare module "*.wasm?module" {
  const wasmModule: WebAssembly.Module;
  export default wasmModule;
}
