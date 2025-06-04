
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"./frontend/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#011D4C',
					foreground: '#ffffff'
				},
				secondary: {
					DEFAULT: '#5F29B4',
					foreground: '#ffffff'
				},
				'deep-blue': '#011D4C',
				'vibrant-purple': '#5F29B4',
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			fontFamily: {
				'corbel': ['Corbel', 'Arial', 'sans-serif'],
				'arabic': ['Amiri', 'Arial', 'sans-serif'],
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(135deg, #011D4C 0%, #5F29B4 100%)',
				'gradient-secondary': 'linear-gradient(135deg, #5F29B4 0%, #011D4C 100%)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'scale-in': 'scale-in 0.5s ease-out',
				'float': 'float 3s ease-in-out infinite'
			},
			spacing: {
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)',
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		function({ addUtilities }: { addUtilities: any }) {
			const newUtilities = {
				'.rtl': {
					direction: 'rtl',
				},
				'.ltr': {
					direction: 'ltr',
				},
				'.text-start': {
					'text-align': 'start',
				},
				'.text-end': {
					'text-align': 'end',
				},
				'.float-start': {
					float: 'left',
					'[dir="rtl"] &': {
						float: 'right',
					},
				},
				'.float-end': {
					float: 'right',
					'[dir="rtl"] &': {
						float: 'left',
					},
				},
				'.border-start': {
					'border-left-width': '1px',
					'[dir="rtl"] &': {
						'border-left-width': '0',
						'border-right-width': '1px',
					},
				},
				'.border-end': {
					'border-right-width': '1px',
					'[dir="rtl"] &': {
						'border-right-width': '0',
						'border-left-width': '1px',
					},
				},
				'.ms-auto': {
					'margin-left': 'auto',
					'[dir="rtl"] &': {
						'margin-left': '0',
						'margin-right': 'auto',
					},
				},
				'.me-auto': {
					'margin-right': 'auto',
					'[dir="rtl"] &': {
						'margin-right': '0',
						'margin-left': 'auto',
					},
				},
			}
			addUtilities(newUtilities)
		}
	],
} satisfies Config;
