"use client"
import React, { useState, useRef } from "react"
import { Button } from "../ui/button"
import { motion, useInView } from "framer-motion"
import Image from "next/image"
import { Separator } from "@radix-ui/react-separator"
import { FaPiggyBank } from "react-icons/fa6"
import { BiSolidBusiness } from "react-icons/bi"
import { AnimateInFromBottomVariants } from "@/lib/variants"
import SectionIntro from "../commons/SectionIntro"

// Define product data structure
interface Product {
	icon: React.ReactNode
	heading: string
	description: string
}

// Define products data
const products: Record<string, Product[]> = {
	individual: [
		{
			icon: (
				<Image
					src="/images/icons/checking-accounts.svg"
					alt="Checking Accounts"
					className="w-6 h-6"
					width={48}
					height={48}
				/>
			),
			heading: "Checking Accounts",
			description:
				"Enjoy easy and convenient access to your funds with our range of checking account options. Benefit from features such as online and mobile banking, debit cards, and free ATM access.",
		},
		{
			icon: (
				<Image
					src="/images/icons/savings-accounts.svg"
					alt="Savings Accounts"
					className="w-6 h-6"
					width={48}
					height={48}
				/>
			),
			heading: "Savings Accounts",
			description:
				"Build your savings with our competitive interest rates and flexible savings account options. Whether you're saving for a specific goal or want to grow your wealth over time, we have the right account for you.",
		},
		{
			icon: (
				<Image
					src="/images/icons/loans-and-mortgage.svg"
					alt="Loans and Mortgages"
					className="w-6 h-6"
					width={48}
					height={48}
				/>
			),
			heading: "Loans and Mortgages",
			description:
				"Realize your dreams with our flexible loan and mortgage options. From personal loans to home mortgages, our experienced loan officers are here to guide you through the application process and help you secure the funds you need.",
		},
	],
	business: [
		{
			icon: (
				<Image
					src="/images/icons/checking-accounts.svg"
					alt="Business Checking"
					className="w-6 h-6"
					width={48}
					height={48}
				/>
			),
			heading: "Business Checking",
			description:
				"Manage your business finances with our versatile checking accounts. Designed for high transaction volumes, they offer a secure and efficient way to handle daily operations.",
		},
		{
			icon: <FaPiggyBank className="w-6 h-6 text-green-80" />,
			heading: "Commercial Loans",
			description:
				"Secure the capital your business needs to grow. Our commercial loans offer competitive rates and flexible terms for expansion, equipment purchase, or working capital.",
		},
		{
			icon: <BiSolidBusiness className="w-6 h-6 text-green-80" />,
			heading: "Merchant Services",
			description:
				"Accept payments from customers easily and securely with our merchant services. We provide solutions for credit card processing, point-of-sale systems, and online payments.",
		},
	],
}

// Props for ProductsSectionContent
interface ProductsSectionContentProps {
	activeTab: string
	isInView: boolean
}

// Props for ProductCard
interface ProductCardProps {
	icon: React.ReactNode
	heading: string
	content: string
	index: number
}

const ProductsSection: React.FC = () => {
	const [activeTab, setActiveTab] = useState<string>("individual")
	const contentRef = useRef<HTMLDivElement>(null)
	const isInView = useInView(contentRef, { amount: 0.3 })

	return (
		<section className="container mx-auto py-6 font-lex mt-6">
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
			<div ref={contentRef}>
				<ProductsSectionContent
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
					<span className="text-white">Our</span> Products
				</>
			}
			description="Explore our diverse rangecomprehensive and customizable banking solutions
			designed to meet your unique financial needs. From personal checking
			and savings accounts to business banking and loans, we offer a
			variety of products that empower you to achieve your financial goals
			with confidence."
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

// Products content component
const ProductsSectionContent: React.FC<ProductsSectionContentProps> = ({
	activeTab,
	isInView,
}) => (
	<div className="mt-8">
		<motion.div
			key={activeTab}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="md:py-4"
		>
			{/* Desktop Layout */}
			<div className="hidden md:flex flex-row items-start justify-between gap-y-8 md:gap-x-4 overflow-x-auto overflow-y-hidden">
				{products[activeTab as keyof typeof products].map(
					(product, index) => (
						<React.Fragment key={product.heading}>
							<ProductCard
								icon={product.icon}
								heading={product.heading}
								content={product.description}
								index={index}
								isInView={isInView}
							/>
							{index <
								products[activeTab as keyof typeof products]
									.length -
									1 && (
								<Separator
									orientation="vertical"
									className="bg-gray-80 h-[220px] w-[1px] my-auto"
								/>
							)}
						</React.Fragment>
					)
				)}
			</div>
		</motion.div>
		{/* Mobile Layout */}
		<div className="grid grid-cols-1 gap-y-8 md:hidden mt-8">
			{products[activeTab as keyof typeof products].map(
				(product, index) => (
					<React.Fragment key={product.heading}>
						<ProductCard
							icon={product.icon}
							heading={product.heading}
							content={product.description}
							index={index}
							isInView={isInView}
						/>
						{index <
							products[activeTab as keyof typeof products]
								.length -
								1 && (
							<Separator className="bg-gray-80 w-full h-px my-auto" />
						)}
					</React.Fragment>
				)
			)}
		</div>
	</div>
)

// Product card component
const ProductCard: React.FC<ProductCardProps & { isInView: boolean }> = ({
	icon,
	heading,
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
		className="mt-8 max-w-xs flex-1 mx-auto"
	>
		<div className="flex flex-col items-center gap-6">
			<div className="flex-shrink-0 bg-green-80/5 p-1.5 rounded-full">
				<div className="flex-shrink-0 bg-green-80/5 p-2 rounded-full">
					{icon}
				</div>
			</div>
			<div className="flex-1 text-center items-center space-y-4 p-6">
				<h4 className="text-base font-semibold text-white">
					{heading}
				</h4>
				<p className="text-gray-30 text-medium">{content}</p>
			</div>
		</div>
	</motion.div>
)

export default ProductsSection
