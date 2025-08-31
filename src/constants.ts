export const CODECS = ["x265", "vt_h265"] as const;

export type Preset = {
  quality: number;
  codec: (typeof CODECS)[number];
};

export const PRESETS = {
  gpu: {
    quality: 55,
    codec: "vt_h265",
  },
  cpu: {
    quality: 22,
    codec: "x265",
  },
} as const satisfies Record<string, Preset>;
