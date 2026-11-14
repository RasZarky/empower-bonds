"use client"
import React from "react"
import Image from "next/image"
import CurrencyExchangeForm from "../commons/CurrencyExchangeForm"
import { motion } from "framer-motion"
import { RandomElementVariants } from "@/lib/variants"
import config from "@/config"

const HeroSection = () => {
	return (
		<section className="container mx-auto py-8 font-lex overflow-hidden">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 py-12">
				{/* Left Content */}
				<div className="flex flex-col space-y-8 items-center lg:items-start text-center lg:text-left">
					<Badge />
					<IntroText />
					<CallToAction />
				</div>

				{/* Right Content */}
				<div className="relative flex justify-center lg:justify-end">
					<BackgroundArrows />
					<IllustrationCard />
				</div>
			</div>
		</section>
	)
}

const Badge = () => (
	<motion.div
		initial="hidden"
		// @ts-expect-error variant error
		variants={RandomElementVariants(1)}
		animate="visible"
		className="flex items-center bg-gray-70 rounded-full px-4 py-1.5 space-x-2 w-max mx-auto lg:mx-0"
	>
		<Image
			src="/images/icons/good-mark.svg"
			alt="Checkmark"
			width={20}
			height={20}
		/>
		<span className="text-xs font-light text-white whitespace-nowrap">
			No LLC Required, No Credit Check
		</span>
	</motion.div>
)

const IntroText = () => (
	<motion.div
		initial="hidden"
		// @ts-expect-error variant error
		variants={RandomElementVariants(2)}
		animate="visible"
		className="flex flex-col space-y-6"
	>
		<h1 className="text-3xl lg:text-5xl font-medium text-white">
			Welcome to {config.TITLE}
			<br />
			Empowering Your{" "}
			<span className="text-green-80 font-semibold">
				Financial Journey
			</span>
		</h1>
		<p className="text-gray-30 leading-relaxed font-medium max-w-lg">
			At {config.TITLE}, our mission is to provide comprehensive banking
			solutions that empower individuals and businesses to achieve their
			financial goals. We are committed to delivering personalized and
			innovative services that prioritize our customers&lsquo; needs.
		</p>
	</motion.div>
)

const CallToAction = () => (
	<motion.button
		// @ts-expect-error variant error
		variants={RandomElementVariants(3)}
		initial="hidden"
		animate="visible"
		className="mx-auto lg:mx-0 default-button"
		type="button"
	>
		Open Account
	</motion.button>
)

const BackgroundArrows = () => (
	<motion.img
		// @ts-expect-error variant error
		variants={RandomElementVariants(0)}
		initial="hidden"
		animate="visible"
		src="/images/abstract/arrows.png"
		alt="Background Arrows"
		width={300}
		height={200}
		className="absolute -top-6 right-0 w-[220px] lg:w-[300px] h-auto -z-10"
	/>
)

const IllustrationCard = () => (
	<motion.div
		// @ts-expect-error variant error
		variants={RandomElementVariants(0)}
		initial="hidden"
		animate="visible"
		className="relative bg-[url('/images/abstract/bg-grunge.png')] bg-repeat bg-gray-100 border-[0.3px] border-gray-70 rounded-xl w-[310px] sm:w-full sm:max-w-[411px] min-h-[502px] p-4 mx-auto"
	>
		<motion.div
			// @ts-expect-error variant error
			variants={RandomElementVariants(0)}
			initial="hidden"
			animate="visible"
		>
			<BackgroundGrunge />
		</motion.div>
		<motion.div
			// @ts-expect-error variant error
			variants={RandomElementVariants(1)}
			initial="hidden"
			animate="visible"
		>
			<MonthlyIncomeBadge />
		</motion.div>
		<motion.div
			className="relative z-10"
			// @ts-expect-error variant error
			variants={RandomElementVariants(2)}
			initial="hidden"
			animate="visible"
		>
			<motion.h2
				className="text-white font-semibold text-sm pt-8"
				// @ts-expect-error variant error
				variants={RandomElementVariants(3)}
				initial="hidden"
				animate="visible"
			>
				Your Transactions
			</motion.h2>
			<motion.img
				as={Image}
				src="/images/transactions/transactions.svg"
				alt="Transactions Illustration"
				width={400}
				height={400}
				className="w-full h-auto mt-2"
				// @ts-expect-error variant error
				variants={RandomElementVariants(4)}
				initial="hidden"
				animate="visible"
			/>
			<motion.h2
				className="text-white font-semibold text-sm pt-8"
				// @ts-expect-error variant error
				variants={RandomElementVariants(5)}
				initial="hidden"
				animate="visible"
			>
				Money Exchange
			</motion.h2>
			<motion.div
				className="w-full bg-gray-90 rounded-xl p-4 mt-2"
				// @ts-expect-error variant error
				variants={RandomElementVariants(6)}
				initial="hidden"
				animate="visible"
			>
				<CurrencyExchangeForm />
			</motion.div>
			<motion.div
				// @ts-expect-error variant error
				variants={RandomElementVariants(7)}
				initial="hidden"
				animate="visible"
			>
				<SupportedCurrenciesBadge />
			</motion.div>
		</motion.div>
	</motion.div>
)

const BackgroundGrunge = () => (
	<div className="absolute w-full h-full top-0 left-0 right-0 bottom-0 inset-0 z-0 bg-gradient-to-tr from-background via-background via-60% to-gray-background/40 rounded-xl"></div>
)

const MonthlyIncomeBadge = () => (
	<div className="absolute -top-4 -left-4 md:-left-8 rounded-xl bg-green-90 p-2 flex items-center gap-1.5">
		<Image
			src="/images/icons/income-icon.svg"
			alt="Income Icon"
			width={20}
			height={20}
			className="md:w-8 md:h-8"
		/>
		<div className="flex flex-col whitespace-nowrap">
			<span className="font-semibold text-xs md:text-base">
				+ $5000.00
			</span>
			<span className="font-medium text-[10px] md:text-xs">
				Monthly Income
			</span>
		</div>
	</div>
)

const SupportedCurrenciesBadge = () => (
	<div className="absolute -bottom-16 -right-8 rounded-full bg-green-90 p-1 sm:p-2 px-3 sm:px-4 flex items-center gap-1.5">
		<span className="font-medium text-[10px] sm:text-xs text-white sm:tracking-wide">
			Supported Currencies:
		</span>
		<Image
			src="/images/icons/supported-currencies.svg"
			alt="Supported Currencies"
			width={24}
			height={24}
			style={{
				width: "auto",
				height: "auto",
			}}
			className="w-auto h-6 sm:h-9 rounded-full"
		/>
	</div>
)

export default HeroSection
