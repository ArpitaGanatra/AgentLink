import { loadFont as loadInstrumentSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadInstrumentSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";

const serif = loadInstrumentSerif();
const sans = loadInstrumentSans();
const mono = loadIBMPlexMono();

export const fonts = {
  serif: serif.fontFamily,
  sans: sans.fontFamily,
  mono: mono.fontFamily,
};
