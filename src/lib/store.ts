import { create } from "zustand";

export type Tier = "full" | "lite" | "static";

type State = {
  /** null until detection has run on the client. */
  tier: Tier | null;
  reducedMotion: boolean;
  sound: boolean;
  /** True while the serpent transition covers the screen. */
  transitioning: boolean;
  menuOpen: boolean;
  /** The serpent mesh is built and its shaders are compiled. */
  sceneReady: boolean;
  /** False while the intro owns the screen. */
  introDone: boolean;
  setTier: (tier: Tier) => void;
  downgrade: () => void;
  setReducedMotion: (value: boolean) => void;
  setSound: (value: boolean) => void;
  setTransitioning: (value: boolean) => void;
  setMenuOpen: (value: boolean) => void;
  setSceneReady: (value: boolean) => void;
  setIntroDone: (value: boolean) => void;
};

export const useStore = create<State>((set) => ({
  tier: null,
  reducedMotion: false,
  sound: false,
  transitioning: false,
  menuOpen: false,
  sceneReady: false,
  introDone: false,
  setTier: (tier) => set({ tier }),
  // The 3D hero is worth keeping: a struggling device drops to Lite, not to Static.
  downgrade: () => set((s) => ({ tier: s.tier === "full" ? "lite" : s.tier })),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setSound: (sound) => set({ sound }),
  setTransitioning: (transitioning) => set({ transitioning }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setIntroDone: (introDone) => set({ introDone }),
}));
