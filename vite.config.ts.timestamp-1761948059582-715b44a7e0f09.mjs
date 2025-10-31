// vite.config.ts
import legacy from "file:///C:/Users/Usuario/Desktop/App%20finanzas/app_movil/node_modules/@vitejs/plugin-legacy/dist/index.mjs";
import vue from "file:///C:/Users/Usuario/Desktop/App%20finanzas/app_movil/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
import { defineConfig } from "file:///C:/Users/Usuario/Desktop/App%20finanzas/app_movil/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Usuario\\Desktop\\App finanzas\\app_movil";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    legacy()
  ],
  server: {
    // Mitiga errores EBUSY en Windows/antivirus/OneDrive usando polling
    // y esperando a que el archivo termine de escribirse antes de reaccionar.
    watch: {
      usePolling: true,
      interval: 200,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    },
    // Si el overlay molesta, cámbialo a false
    hmr: { overlay: true }
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  test: {
    globals: true,
    environment: "jsdom"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc3VhcmlvXFxcXERlc2t0b3BcXFxcQXBwIGZpbmFuemFzXFxcXGFwcF9tb3ZpbFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVXN1YXJpb1xcXFxEZXNrdG9wXFxcXEFwcCBmaW5hbnphc1xcXFxhcHBfbW92aWxcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1VzdWFyaW8vRGVza3RvcC9BcHAlMjBmaW5hbnphcy9hcHBfbW92aWwvdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XHJcblxyXG5pbXBvcnQgbGVnYWN5IGZyb20gJ0B2aXRlanMvcGx1Z2luLWxlZ2FjeSdcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHZ1ZSgpLFxyXG4gICAgbGVnYWN5KClcclxuICBdLFxyXG4gIHNlcnZlcjoge1xyXG4gICAgLy8gTWl0aWdhIGVycm9yZXMgRUJVU1kgZW4gV2luZG93cy9hbnRpdmlydXMvT25lRHJpdmUgdXNhbmRvIHBvbGxpbmdcclxuICAgIC8vIHkgZXNwZXJhbmRvIGEgcXVlIGVsIGFyY2hpdm8gdGVybWluZSBkZSBlc2NyaWJpcnNlIGFudGVzIGRlIHJlYWNjaW9uYXIuXHJcbiAgICB3YXRjaDoge1xyXG4gICAgICB1c2VQb2xsaW5nOiB0cnVlLFxyXG4gICAgICBpbnRlcnZhbDogMjAwLFxyXG4gICAgICBhd2FpdFdyaXRlRmluaXNoOiB7XHJcbiAgICAgICAgc3RhYmlsaXR5VGhyZXNob2xkOiA1MDAsXHJcbiAgICAgICAgcG9sbEludGVydmFsOiAxMDAsXHJcbiAgICAgIH0gYXMgYW55LFxyXG4gICAgfSxcclxuICAgIC8vIFNpIGVsIG92ZXJsYXkgbW9sZXN0YSwgY1x1MDBFMW1iaWFsbyBhIGZhbHNlXHJcbiAgICBobXI6IHsgb3ZlcmxheTogdHJ1ZSB9LFxyXG4gIH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICB0ZXN0OiB7XHJcbiAgICBnbG9iYWxzOiB0cnVlLFxyXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbSdcclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFFQSxPQUFPLFlBQVk7QUFDbkIsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sVUFBVTtBQUNqQixTQUFTLG9CQUFvQjtBQUw3QixJQUFNLG1DQUFtQztBQVF6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixPQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsUUFBUTtBQUFBO0FBQUE7QUFBQSxJQUdOLE9BQU87QUFBQSxNQUNMLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQSxNQUNWLGtCQUFrQjtBQUFBLFFBQ2hCLG9CQUFvQjtBQUFBLFFBQ3BCLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsS0FBSyxFQUFFLFNBQVMsS0FBSztBQUFBLEVBQ3ZCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsRUFDZjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
