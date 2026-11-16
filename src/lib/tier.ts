import type { Tier } from "./store";

/**
 * GPU-based quality tier, decided once on the client with no network request.
 *
 *  full   — desktop-class or flagship GPU: full DPR, post-processing allowed.
 *  lite   — mid-range phones and integrated graphics: capped DPR, no post.
 *  static — no usable WebGL, software rendering, data saver or very weak
 *           hardware: no canvas at all, CSS/video fallbacks instead.
 *
 * A runtime frame-rate monitor can still step a device down a tier.
 */

const SOFTWARE = /swiftshader|llvmpipe|software|basic render|microsoft basic/i;
const WEAK =
  /mali-4|mali-t[67]|mali-g5[127]|mali-g31|adreno \(tm\) [2-5]\d\d|adreno [2-5]\d\d|powervr (sgx|rogue ge)|intel(\(r\))? hd graphics [2-5]\d{3}|videocore/i;
const STRONG =
  /apple (m\d|a1[4-9]|gpu)|nvidia|geforce|rtx|gtx|radeon (rx|pro)|adreno \(tm\) (7[3-9]\d|8\d\d)|adreno (7[3-9]\d|8\d\d)|mali-g7[1-9]\d|immortalis|iris xe|arc\b/i;

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

export function detectTier(): Tier {
  const override = new URLSearchParams(window.location.search).get("tier");
  if (override === "full" || override === "lite" || override === "static") return override;

  const nav = navigator as NavigatorHints;
  if (nav.connection?.saveData) return "static";
  if (nav.connection?.effectiveType && /2g/.test(nav.connection.effectiveType)) return "static";

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    failIfMajorPerformanceCaveat: true,
    powerPreference: "high-performance",
  });
  if (!gl) return "static";

  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = String(
    info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
  );
  const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  gl.getExtension("WEBGL_lose_context")?.loseContext();

  if (SOFTWARE.test(renderer)) return "static";

  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const mobile =
    matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 900;

  if (memory <= 2 || cores <= 2 || maxTexture < 4096) return "static";
  if (WEAK.test(renderer)) return mobile ? "static" : "lite";
  if (STRONG.test(renderer)) return mobile && memory < 6 ? "lite" : "full";

  // Unknown GPU: trust the rest of the hardware.
  if (mobile) return "lite";
  return cores >= 8 && memory >= 8 ? "full" : "lite";
}

export const tierSettings = {
  full: {
    dpr: [1, 2] as [number, number],
    antialias: true,
    fogOctaves: 4,
    serpentSegments: 520,
    serpentRadial: 14,
    scales: true,
  },
  lite: {
    dpr: [1, 1.5] as [number, number],
    antialias: false,
    fogOctaves: 2,
    serpentSegments: 280,
    serpentRadial: 8,
    scales: false,
  },
} as const;
