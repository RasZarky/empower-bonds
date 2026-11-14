"use client"
import React, { useState, useRef } from "react"
import { Button } from "../ui/button"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/eldoraui/carousel"
import { AnimateInFromBottomVariants } from "@/lib/variants"
import SectionIntro from "../commons/SectionIntro"
import config from "@/config"

// Define product data structure
interface Testimonial {
	name: string
	description: string
}

// Define products data
const testimonials: Record<string, Testimonial[]> = {
	individual: [
		{
			name: "John Doe",
			description: `${config.TITLE} has transformed my financial journey. Their checking account makes managing my money effortless with seamless online banking and free ATM access. I feel confident and in control of my finances!`,
		},
		{
			name: "Emma Rodriguez",
			description: `The savings account from ${config.TITLE} offers fantastic interest rates. It’s helped me save for my dream home while their mobile app keeps me updated on my progress. Highly recommend their personalized service!`,
		},
		{
			name: "Michael Chen",
			description: `Securing a mortgage with ${config.TITLE} was a breeze. Their loan officers guided me through every step, and the flexible terms made my homeownership dream a reality. Truly exceptional support!`,
		},
		{
			name: "Sarah Johnson",
			description: `I love the convenience of ${config.TITLE}’ online banking platform. Transferring funds and paying bills is so easy, and their secure transactions give me peace of mind. A game-changer for my daily finances!`,
		},
		{
			name: "David Kim",
			description: `${config.TITLE} helped me plan for retirement with their tailored financial advice. Their investment options are diverse and easy to understand, making it simple to grow my wealth confidently.`,
		},
	],
	business: [
		{
			name: "Stella Zeal",
			description: `${config.TITLE}’ business checking account streamlined our operations. The high transaction capacity and secure platform allow us to focus on growth while managing finances effortlessly.`,
		},
		{
			name: "BrightFuture Tech",
			description: `The commercial loan from ${config.TITLE} gave us the capital to expand our startup. Their competitive rates and flexible terms were exactly what we needed to scale our business.`,
		},
		{
			name: "GreenLeaf Retail",
			description: `${config.TITLE}’ merchant services have been a lifesaver. Their seamless credit card processing and POS solutions have made transactions smooth and boosted our customer satisfaction.`,
		},
		{
			name: "Horizon Consulting",
			description: `Working with ${config.TITLE} has been phenomenal. Their 24/7 customer support and personalized assistance helped us navigate complex financial decisions with ease and confidence.`,
		},
		{
			name: "Unity Logistics",
			description: `${config.TITLE}’ financial tools have optimized our cash flow management. Their budgeting and planning services are top-notch, helping us achieve our business goals efficiently.`,
		},
	],
}

// Props for TestimonialSectionContent
interface TestimonialSectionContentProp {
	activeTab: string
	isInView: boolean
}

// Props for TestimonialCard
interface TestimonialCardProps {
	name: string
	content: string
	index: number
	isInView: boolean
}

const TestimonialSection: React.FC = () => {
	const [activeTab, setActiveTab] = useState<string>("individual")
	const contentRef = useRef<HTMLDivElement>(null)
	const isInView = useInView(contentRef, { amount: 0.3 })

	return (
		<section className="container mx-auto py-6 font-lex my-12">
			<div className="gap-6 md:gap-8 flex flex-col md:flex-row items-center md:items-end text-center md:text-left md:justify-between">
				{/* Introduction Section */}
				<Introduction />
				{/* Tab Navigation */}
				<TabNavigation
					activeTab={activeTab}
					setActiveTab={setActiveTab}
				/>
			</div>
			{/* Product Content */}
			<div
				className="max-w-full"
				ref={contentRef}
			>
				<TestimonialSectionContent
					activeTab={activeTab}
					isInView={isInView}
				/>
			</div>
		</section>
	)
}

// Introduction component
const Introduction: React.FC = () => (
	<div className="flex flex-col gap-4">
		<SectionIntro
			title={
				<>
					<span className="text-white">Our</span> Testimonials
				</>
			}
			description={`Discover how ${config.TITLE} has transformed lives with innovative digital solutions and personalised customer service. See why our clients trust us for a secure and prosperous financial journey.`}
		/>
	</div>
)

// Tab navigation component
const TabNavigation: React.FC<{
	activeTab: string
	setActiveTab: React.Dispatch<React.SetStateAction<string>>
}> = ({ activeTab, setActiveTab }) => (
	<div className="bg-gray-80 p-1.5 rounded-full flex items-center w-fit mx-auto md:mx-0 relative mt-4 md:mt-0">
		<Button
			onClick={() => setActiveTab("individual")}
			className={`font-semibold px-6 py-3 cursor-pointer bg-transparent hover:bg-transparent rounded-full relative z-10 transition-colors duration-300 ${
				activeTab === "individual" && "text-gray-90 hover:text-gray-90"
			}`}
			type="button"
		>
			For Individuals
		</Button>
		<Button
			onClick={() => setActiveTab("business")}
			className={`font-semibold px-6 py-3 cursor-pointer bg-transparent hover:bg-transparent rounded-full relative z-10 transition-colors duration-300 ${
				activeTab === "business" && "text-gray-90 hover:text-gray-90"
			}`}
			type="button"
		>
			For Businesses
		</Button>
		<motion.div
			layoutId="activeTabIndicator"
			transition={{
				type: "spring",
				stiffness: 500,
				damping: 30,
			}}
			className="absolute w-1/2 h-[80%] bg-green-80 rounded-full z-0 pointer-events-none left-1.5"
			initial={false}
			animate={{
				x: activeTab === "individual" ? 0 : "92%",
			}}
		/>
	</div>
)

// Testimonial content component
const TestimonialSectionContent: React.FC<TestimonialSectionContentProp> = ({
	activeTab,
	isInView,
}) => (
	<Carousel
		orientation="horizontal"
		className="mt-8 max-w-full"
	>
		<motion.div
			key={activeTab}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="relative md:py-16 max-w-full h-fit"
		>
			{/* Desktop Layout */}
			<CarouselContent className="relative max-w-full max-h-[500px]">
				{testimonials[activeTab as keyof typeof testimonials].map(
					(testimonial, index) => (
						<CarouselItem
							className="max-w-fit h-full"
							key={index}
						>
							<React.Fragment key={testimonial.name}>
								<TestimonialCard
									name={testimonial.name}
									content={testimonial.description}
									index={index}
									isInView={isInView}
								/>
							</React.Fragment>
						</CarouselItem>
					)
				)}
			</CarouselContent>
			<div className="h-full w-0 lg:w-32 absolute left-0 top-0 bottom-0 bg-gradient-to-r from-gray-100 to-gray-100/60 flex items-center"></div>
			<div className="h-full w-0 lg:w-32 absolute right-0 top-0 bottom-0 bg-gradient-to-l from-gray-100 to-gray-100/60 flex items-center"></div>
			<CarouselPrevious className="text-green-80 hover:bg-green-80 hover:text-gray-90 cursor-pointer lg:center lg:absolute lg:left-0 lg:top-1/2" />
			<CarouselNext className="text-green-80 hover:bg-green-80 hover:text-gray-90 cursor-pointer lg:center lg:absolute lg:right-0 lg:top-1/2" />
		</motion.div>
	</Carousel>
)

// Testimonial card component
const TestimonialCard: React.FC<TestimonialCardProps> = ({
	name,
	content,
	index,
	isInView,
}) => (
	<motion.div
		// @ts-expect-error variant error
		variants={AnimateInFromBottomVariants}
		initial="hidden"
		animate={isInView ? "visible" : "hidden"}
		custom={index}
		className="w-full lg:max-w-md flex-shrink-0 flex-1 mx-auto"
	>
		<div className="border-[0.3px] lg:border-0 max-h-max border-gray-80 p-4 rounded-xl flex flex-col items-center gap-6 h-full">
			<Image
				src="/images/icons/quote.svg"
				alt="quote"
				width={38.82}
				height={49.41}
			/>
			<div className="flex-1 flex flex-col text-center items-center gap-8 p-6">
				<p className="text-gray-30 text-medium">{content}</p>
				<span className="text-sm flex w-fit text-green-80 font-semibold">
					{name}
				</span>
			</div>
		</div>
	</motion.div>
)

export default TestimonialSection
