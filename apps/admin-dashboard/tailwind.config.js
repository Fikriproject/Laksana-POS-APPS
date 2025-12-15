/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#6467f2",
                "primary-dark": "#4f51c9",
                "background-light": "#f6f6f8",
                "background-dark": "#101122",
                "surface-light": "#ffffff",
                "surface-dark": "#1e1e2d",
                "surface-dark-alt": "#16161e",
                "border-dark": "#282839",
                "border-light": "#e2e8f0",
                "text-secondary": "#9d9db9",
                "text-primary-light": "#1a202c",
                "text-primary-dark": "#ffffff",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
}
