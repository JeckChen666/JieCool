/** @type {import('tailwindcss').Config} */
module.exports = {
  // Disable Tailwind's Preflight (CSS reset) to avoid conflicts with Arco Design form labels
  corePlugins: {
    preflight: false,
  },
};