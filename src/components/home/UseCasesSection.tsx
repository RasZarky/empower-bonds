"use client"
import React, { useRef } from "react"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import BackgroundImageLeftTop from "../commons/BackgroundImageLeftTop"
import BackgroundImageRightTop from "../commons/BackgroundImageRightTop"
import { useIsMobile } from "@/hooks/use-mobile"
import { Separator } from "../ui/separator"
import { AnimateInViewLeftOrRightVariants } from "@/lib/variants"
import SectionIntro from "../commons/SectionIntro"
import config from "@/config";
// Types
interface UseCase {
	icon: string // Path to icon asset
	title: string
	alt: string // Accessibility alt text for icon
}
interface Sections {
	title: string
	description: string
	ratings: {
		score: number
		caption: string
	}[]
}
interface BannerProps {
	className?: string
	useCases: UseCase[]
	right?: boolean
}
interface UseCaseCardProps {
	icon: string
	title: string
	alt: string
}

// Data
const individualUseCases: UseCase[] = [
	{
		icon: "/images/icons/mpf.svg",
		title: "Managing Personal Finances",
		alt: "Personal finances icon",
	},
	{
		icon: "/images/icons/sff.svg",
		title: "Saving for the Future",
		alt: "Saving for the future icon",
	},
	{
		icon: "/images/icons/ho.svg",
		title: "Home Ownership",
		alt: "Home ownership icon",
	},
	{
		icon: "/images/icons/ef.svg",
		title: "Education Funding",
		alt: "Education funding icon",
	},
]
const businessUseCases: UseCase[] = [
	{
		icon: "/images/icons/sae.svg",
		title: "Startups and Entrepreneurs",
		alt: "Startups and entrepreneurs icon",
	},
	{
		icon: "/images/icons/cfm.svg",
		title: "Cash Flow Management",
		alt: "Cash flow management icon",
	},
	{
		icon: "/images/icons/be.svg",
		title: "Business Expansion",
		alt: "Business expansion icon",
	},
	{
		icon: "/images/icons/ps.svg",
		title: "Payment Solutions",
		alt: "Payment solutions icon",
	},
]
const sections: Sections[] = [
	{
		title: "For Individuals",
		description:
			`${config.TITLE} offers a range of financial products tailored to meet the unique needs of individuals. Whether you're looking to manage your personal finances, save for the future, or invest in your dreams, we have the right solutions for you.`,
		ratings: [
			{ score: 78, caption: "Customer Satisfaction" },
			{ score: 47, caption: "Ease of Use" },
			{ score: 49, caption: "Support Quality" },
		],
	},
	{
		title: "For Businesses",
		description:
			"Our business banking solutions are designed to help companies of all sizes thrive. From startups to established enterprises, we provide the tools and resources you need to manage your finances, streamline operations, and grow your business.",
		ratings: [
			{ score: 65, caption: "Business Satisfaction" },
			{ score: 45, caption: "Financial Solutions" },
			{ score: 48, caption: "Streamline Payroll Processing" },
		],
	},
]

// Components
/**
 * Renders a single use case card with an icon and title.
 * @param {UseCaseCardProps} props - Icon, title, and alt text for the card.
 */
const UseCaseCard: React.FC<UseCaseCardProps> = ({ icon, title, alt }) => (
	<div className="flex flex-col items-center w-full p-6 rounded-xl bg-background border-[0.25px] border-gray-70 text-white transition-transform">
		<div className="mb-4 w-fit h-fit">
			<Image
				src={icon}
				alt={alt}
				width={80}
				height={80}
				className="object-contain w-12 h-12 lg:w-16 lg:h-16"
				aria-hidden="false"
			/>
		</div>
		<h3 className="text-xs lg:text-sm font-medium text-center">{title}</h3>
	</div>
)

/**
 * Renders a banner with a grid of use case cards and a decorative background image.
 * @param {BannerProps} props - ClassName, use cases data, and background image position.
 */
const Banner: React.FC<BannerProps & { isInView: boolean }> = ({
	className = "",
	useCases,
	right = false,
	isInView,
}) => {
	const isMobile = useIsMobile()

	return (
		<motion.div
			// @ts-expect-error variant error
			variants={AnimateInViewLeftOrRightVariants}
			initial="hidden"
			animate={isInView ? "visible" : "hidden"}
			custom={right}
			className={`${right && "lg:order-2"} relative mx-auto container rounded-xl p-8 sm:p-12 bg-gray-80 flex flex-col gap-6 overflow-hidden ${className}`}
		>
			{/* Background decorative image */}
			{!right ? (
				<BackgroundImageLeftTop />
			) : isMobile ? (
				<BackgroundImageLeftTop />
			) : (
				<BackgroundImageRightTop />
			)}
			<div className="relative z-30 grid grid-cols-2 gap-4">
				{useCases.map((useCase, index) => (
					<UseCaseCard
						key={`${useCase.title}-${index}`}
						icon={useCase.icon}
						title={useCase.title}
						alt={useCase.alt}
					/>
				))}
			</div>
		</motion.div>
	)
}

/**
 * Renders a section with title, description, and ratings.
 * @param {Sections} props - Title, description, and ratings data.
 */
const CaseSection: React.FC<Sections & { isInView: boolean }> = ({
	title,
	description,
	ratings,
	isInView,
}) => {
	return (
		<motion.div
			// @ts-expect-error variant error
			variants={AnimateInViewLeftOrRightVariants}
			initial="hidden"
			animate={isInView ? "visible" : "hidden"}
			custom={title === "For Businesses"}
			className={`${title === "For Businesses" && "lg:order-1"} flex flex-col gap-4`}
		>
			<h3 className="text-3xl font-semibold text-white font-lex">
				{title}
			</h3>
			<p className="text-gray-30 lg:text-lg">{description}</p>
			{/* Desktop Layout */}
			<div className="mt-8 hidden md:flex flex-row items-center justify-between gap-y-8 md:gap-x-4 overflow-x-auto">
				{ratings.map((rating, index) => (
					<React.Fragment key={index}>
						{/* Add the rating and its caption */}
						<div className="flex flex-col items-center gap-2">
							<span className="text-3xl lg:text-5xl font-bold text-green-80">
								{rating.score} %
							</span>
							<span className="text-gray-30 text-xs md:text-sm">
								{rating.caption}
							</span>
						</div>
						{index < ratings.length - 1 && (
							<Separator
								orientation="vertical"
								className="bg-gray-80 h-[220px] w-[1px] my-auto"
							/>
						)}
					</React.Fragment>
				))}
			</div>
			{/* Mobile Layout */}
			<div className="grid grid-cols-1 gap-y-8 md:hidden mt-8">
				{ratings.map((rating, index) => (
					<React.Fragment key={index}>
						{/* Add the rating and its caption */}
						<div className="flex flex-col items-center">
							<span className="text-3xl font-bold text-green-80">
								{rating.score}
							</span>
							<span className="text-gray-30 text-xs">
								{rating.caption}
							</span>
						</div>
						{index < ratings.length - 1 && (
							<Separator className="bg-gray-80 w-full h-px my-auto" />
						)}
					</React.Fragment>
				))}
			</div>
		</motion.div>
	)
}

/**
 * Renders the use cases section with a header and two banners for individual and business use cases.
 */
const UseCasesSection: React.FC = () => {
	const individualRef = useRef<HTMLDivElement>(null)
	const businessRef = useRef<HTMLDivElement>(null)
	const individualInView = useInView(individualRef, { amount: 0.3 })
	const businessInView = useInView(businessRef, { amount: 0.3 })

	return (
		<section className="container mx-auto py-12 font-lex flex flex-col gap-12 overflow-hidden">
			<SectionIntro
				title="Use Cases"
				description={`At ${config.TITLE}, we cater to the diverse needs of individuals and businesses alike, offering a wide range of financial solutions.`}
			/>
			<div className="flex flex-col gap-12 text-center lg:text-left">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{sections.map((section, index) => (
						<React.Fragment key={index}>
							<Banner
								useCases={
									section.title === "For Individuals"
										? individualUseCases
										: businessUseCases
								}
								right={section.title !== "For Individuals"}
								isInView={
									section.title === "For Individuals"
										? individualInView
										: businessInView
								}
							/>
							<div
								ref={
									section.title === "For Individuals"
										? individualRef
										: businessRef
								}
							>
								<CaseSection
									title={section.title}
									description={section.description}
									ratings={section.ratings}
									isInView={
										section.title === "For Individuals"
											? individualInView
											: businessInView
									}
								/>
							</div>
						</React.Fragment>
					))}
				</div>
			</div>
		</section>
	)
}

export default UseCasesSection
