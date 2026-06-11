/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CANVASKIT_WASM_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
