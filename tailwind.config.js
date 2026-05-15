/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                slate: {
                    800: '#1e293b',
                    900: '#0f172a',
                },
                gold: {
                    400: '#facc15', // yellow-400
                    500: '#eab308', // yellow-500
                    600: '#ca8a04', // yellow-600
                }
            }
        },
    },
    plugins: [],
}
