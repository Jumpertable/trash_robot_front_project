import tailwindPostcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

process.env.CSS_TRANSFORMER_WASM = '1';
export default {
  plugins: {
    [tailwindPostcss]: {},
    autoprefixer: {},
  },
};
