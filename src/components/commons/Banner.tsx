"use client"
import React, { useRef } from "react"
import Image from "next/image"
import BackgroundImageLeftTop from "./BackgroundImageLeftTop"
import { motion, useInView } from "framer-motion"
import { zoomVariants } from "@/lib/variants"
import config from "@/config"

// Banner component props
interface BannerProps {
	className?: string
}

/**
 * Banner component promotes company with a call-to-action to open an account.
 * Features a background image, heading, description, and a button.
 */
const Banner: React.FC<BannerProps> = ({ className = "" }) => {
	const ref = useRef<HTMLDivElement>(null)
	const isInView = useInView(ref, { amount: 0.3 })

	return (
		<motion.div
			ref={ref}
			// @ts-expect-error variant error
			variants={zoomVariants(1)}
			initial="hidden"
			animate={isInView ? "visible" : "hidden"}
			className={`overflow-hidden container rounded-xl p-12 bg-gray-80 relative mx-auto flex flex-col lg:flex-row items-center md:justify-between gap-6 ${className}`}
		>
			{/* Background decorative image */}
			<BackgroundImageLeftTop />

			{/* Background Grunge image */}
			<Image
				className="absolute z-0 bottom-0 right-0 top-0 left-0 w-full h-full opacity-40"
				src="/images/abstract/bg-grunge.png"
				alt="Decorative background"
				width={1800}
				height={900}
				priority
			/>

			{/* Background Gradient */}
			<div className="w-full absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-tr from-gray-70/10 via-gray-80 to-gray-80 z-10"></div>

			{/* Content section */}
			<div className="relative z-30 flex flex-col space-y-3 items-center md:items-start sm:max-w-4xl">
				<h2 className="text-3xl font-semibold text-white text-center md:text-left">
					Start your financial journey today with{" "}
					<span className="text-green-80">{config.TITLE}</span>
				</h2>
				<p className="text-gray-20 text-center md:text-left">
					Your key to unlocking a future of possibilities. Our bonds
					are more than just a secure investment; they&apos;re a
					commitment to your financial well-being. Designed for both
					stability and growth, they provide a reliable way to invest
					in your dreams, whether you&apos;re saving for a new home,
					building a retirement fund, or simply securing your wealth
					with confidence. Take the first step today and let us help
					you achieve your financial goals.
				</p>
			</div>
			{/* Call-to-action button */}
			<button
				type="button"
				className="default-button z-30 relative flex-none "
			>
				Open Account
			</button>
		</motion.div>
	)
}

export default Banner
