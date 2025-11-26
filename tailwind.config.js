/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Raleway"', 'sans-serif'],
                orbitron: ['Orbitron', 'sans-serif'],
                roboto: ['Roboto', 'sans-serif'],
                poppins: ['Poppins', 'sans-serif'],
                montserrat: ['Montserrat', 'sans-serif'],
                manrope: ['Manrope', 'sans-serif'],
                raleway: ['Raleway', 'sans-serif'],
                'suse-mono': ['"SUSE Mono"', 'monospace'],
                'martel-sans': ['"Martel Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
