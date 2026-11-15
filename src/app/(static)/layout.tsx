import type { Metadata } from "next"
import { Geist, Geist_Mono, Lexend } from "next/font/google"
import "@/app/globals.css"
import config from "@/config"
import { createMetadata } from "@/lib/metadata"
import { Toaster } from "sonner"
import Footer from "@/components/commons/Footer"
import Header from "@/components/commons/Header"
import { buildNotifications } from "@/lib/notifications"
import { DEMO_TRANSACTIONS, DEMO_USER } from "@/lib/demo"

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
})

const lexend = Lexend({
	variable: "--font-lex",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800", "900"],
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
})

export const metadata: Metadata = createMetadata({
	title: {
		template: `%s | ${config.TITLE}`,
		default:
			config.TITLE +
			" - A Convenient and Secure Way to Bank with High-Yield Interest",
	},
	description:
		"Unlock your financial potential with HB Fiances. We offer a convenient and secure online banking experience with high-yield interest accounts, seamless transactions, and robust financial tools designed to help you grow your savings. Start banking smarter today!",
	metadataBase: new URL(config.BASE_URL),
})

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	// The exported site is the sample account only, so the bell always shows
	// ledger activity from the demo data.
	const notifications = buildNotifications({
		name: DEMO_USER.name,
		transactions: DEMO_TRANSACTIONS,
	})

	return (
		<html lang="en">
			<body
				className={`relative ${geistSans.variable} ${geistMono.variable} ${lexend.variable} antialiased text-gray-20 font-medium`}
			>
				<Header session={null} notifications={notifications} />

				<main className="px-6 space-y-16 flex flex-col w-screen">
					{children}
				</main>

				<Footer />

				<Toaster
					richColors={true}
					expand={true}
				/>
			</body>
		</html>
	)
}
