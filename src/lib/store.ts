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
  setTier: (tier: Tier) => void;
  downgrade: () => void;
  setReducedMotion: (value: boolean) => void;
  setSound: (value: boolean) => void;
  setTransitioning: (value: boolean) => void;
  setMenuOpen: (value: boolean) => void;
};

export const useStore = create<State>((set) => ({
  tier: null,
  reducedMotion: false,
  sound: false,
  transitioning: false,
  menuOpen: false,
  setTier: (tier) => set({ tier }),
  downgrade: () =>
    set((s) => ({ tier: s.tier === "full" ? "lite" : s.tier === "lite" ? "static" : s.tier })),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setSound: (sound) => set({ sound }),
  setTransitioning: (transitioning) => set({ transitioning }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
}));
