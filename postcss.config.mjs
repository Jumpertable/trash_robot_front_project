import tailwindcss from 'tailwindcss';
import autoprefixer from "autoprefixer";

process.env.CSS_TRANSFORMER_WASM = '1';
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
