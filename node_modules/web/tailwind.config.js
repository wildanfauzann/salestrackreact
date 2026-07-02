/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        "colors": {
            "surface-container-lowest": "#010f1f",
            "surface-dim": "#051424",
            "tertiary-fixed": "#68fcbf",
            "on-tertiary-fixed-variant": "#005137",
            "secondary-fixed-dim": "#2fd9f4",
            "error": "#ffb4ab",
            "on-primary": "#131e8c",
            "on-background": "#d4e4fa",
            "surface-bright": "#2c3a4c",
            "on-error": "#690005",
            "inverse-surface": "#d4e4fa",
            "primary": "#bdc2ff",
            "surface-container-low": "#0d1c2d",
            "on-tertiary-fixed": "#002114",
            "primary-container": "#818cf8",
            "primary-fixed": "#e0e0ff",
            "on-secondary": "#00363e",
            "primary-fixed-dim": "#bdc2ff",
            "outline": "#908f9e",
            "inverse-primary": "#4953bc",
            "secondary-fixed": "#a2eeff",
            "error-container": "#93000a",
            "tertiary": "#45dfa4",
            "on-surface": "#d4e4fa",
            "on-secondary-container": "#00515d",
            "on-secondary-fixed": "#001f25",
            "tertiary-fixed-dim": "#45dfa4",
            "on-primary-fixed": "#000767",
            "on-tertiary-container": "#003523",
            "on-primary-fixed-variant": "#2f3aa3",
            "surface": "#051424",
            "surface-container-highest": "#273647",
            "secondary-container": "#00cbe6",
            "tertiary-container": "#00aa78",
            "on-error-container": "#ffdad6",
            "surface-variant": "#273647",
            "outline-variant": "#454653",
            "background": "#051424",
            "on-primary-container": "#101b8a",
            "on-surface-variant": "#c6c5d5",
            "inverse-on-surface": "#233143",
            "secondary": "#5de6ff",
            "surface-container-high": "#1c2b3c",
            "on-secondary-fixed-variant": "#004e5a",
            "on-tertiary": "#003825",
            "surface-tint": "#bdc2ff",
            "surface-container": "#122131"
        },
        "borderRadius": {
            "DEFAULT": "0.25rem",
            "lg": "0.5rem",
            "xl": "0.75rem",
            "full": "9999px"
        },
        "spacing": {
            "sm": "8px",
            "gutter": "20px",
            "xs": "4px",
            "container-margin": "40px",
            "base": "4px",
            "md": "16px",
            "lg": "24px",
            "xl": "32px"
        },
        "fontFamily": {
            "headline-lg": ["Outfit"],
            "body-md": ["Inter"],
            "label-md": ["Inter"],
            "body-lg": ["Inter"],
            "body-sm": ["Inter"],
            "headline-md": ["Outfit"],
            "headline-lg-mobile": ["Outfit"],
            "headline-xl": ["Outfit"]
        },
        "fontSize": {
            "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
            "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
            "label-md": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
            "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
            "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
            "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
            "headline-lg-mobile": ["28px", { "lineHeight": "36px", "fontWeight": "700" }],
            "headline-xl": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }]
        }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
