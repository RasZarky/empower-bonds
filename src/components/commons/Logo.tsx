"use client"
import React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import config from "@/config"

// Logo component props
interface LogoProps {
	className?: string
}

/**
 * Logo component displays the Compoany logo with responsive image sizes
 * and hover effects on the text.
 */
const Logo: React.FC<LogoProps> = ({ className = "" }) => {
	const router = useRouter()
	return (
		<div
			onClick={() => router.push("/")}
			className={`flex items-center space-x-2 group cursor-pointer ${className}`}
		>
			{/* Desktop logo image */}
			<Image
				src="/images/logo/shape-30.svg"
				alt={`Logo`}
				className="hidden lg:block w-10 h-10"
				width={40}
				height={40}
			/>
			{/* Mobile logo image */}
			<Image
				src="/images/logo/shape-30.svg"
				alt={`Logo`}
				className="lg:hidden w-8 h-8"
				width={40}
				height={40}
			/>
			{/* Logo text with hover effect */}
			<span className="text-white group-hover:text-green-80 duration-300 ease-in-out lg:text-lg font-semibold font-lex text-base">
				{config.TITLE}
			</span>
		</div>
	)
}

export default Logo
