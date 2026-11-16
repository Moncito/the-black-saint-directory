/** Shared between the viewer shell and its lazily loaded 3D scene. */
export type Spin = { yaw: number; pitch: number; vYaw: number; vPitch: number; dragging: boolean };

/** Hotspot anchors on the vessel, in its own space, with their outward normals. */
export const HOTSPOTS: { at: [number, number, number]; normal: [number, number, number] }[] = [
  { at: [0.62, 0.78, 0.0], normal: [1, 0.2, 0] },
  { at: [-0.5, -0.1, 0.62], normal: [-0.6, 0, 0.8] },
  { at: [0.1, -1.02, -0.52], normal: [0.2, -0.2, -1] },
];
