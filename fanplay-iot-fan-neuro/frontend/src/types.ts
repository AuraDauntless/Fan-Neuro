export type Song = {
  id: string;
  title: string;
  artist: string;
  streamUrl: string;
  artworkUrl: string;
};

export type EEGDataPayload = {
  F1: number[];
  F2: number[];
  Fz: number[];
  P1: number[];
  P2: number[];
  Pz: number[];
  O1: number[];
  O2: number[];
};
