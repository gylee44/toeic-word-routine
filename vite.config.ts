// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// AWS Amplify Hosting(SSR) 배포용 프리셋. 빌드 출력은 .amplify-hosting
// 래퍼의 nitro 옵션 타입에 awsAmplify가 없어서, 변수로 빼 초과 속성 검사를 피한다. (런타임은 nitro가 읽는다)
const nitroOptions = { preset: "aws_amplify", awsAmplify: { runtime: "nodejs22.x" } };

export default defineConfig({
  nitro: nitroOptions,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
