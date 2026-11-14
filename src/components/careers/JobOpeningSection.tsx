"use client"

import React, { useRef } from "react"
import { motion, useInView } from "framer-motion"
import SectionIntro from "../commons/SectionIntro"
import { AnimateInFromBottomVariants } from "@/lib/variants"
import Image from "next/image"

const jobOpenings = [
	{
		title: "Senior Software Engineer (Frontend)",
		department: "Technology / Digital Banking",
		description:
			"Lead the development of our customer-facing web and mobile applications, focusing on performance, responsiveness, and seamless user experience.",
		requirements: [
			"5+ years in frontend development with React/Next.js and TypeScript.",
			"Deep understanding of state management and API integration (REST/GraphQL).",
			"Proven experience with responsive design and accessibility standards.",
		],
	},
	{
		title: "Financial Analyst (Investment Strategy)",
		department: "Finance / Strategy",
		description:
			"Provide critical analysis to guide our investment strategy and portfolio management decisions, focusing on market trends and risk assessment.",
		requirements: [
			"Bachelor's degree in Finance, Economics, or related field.",
			"3+ years of experience in financial modeling and data analysis.",
			"CFA designation or progress toward it is a plus.",
		],
	},
	{
		title: "IT Security Specialist (Threat Hunting)",
		department: "Information Security",
		description:
			"Focus on proactive threat hunting, incident response, and maintaining the confidentiality and integrity of our systems against evolving cyber threats.",
		requirements: [
			"5+ years of experience in IT Security or a similar role.",
			"In-depth knowledge of network security, firewalls, and SIEM tools.",
			"Certifications like CISSP or CISM are highly preferred.",
		],
	},
	{
		title: "Customer Relationship Manager",
		department: "Retail Banking",
		description:
			"Be the primary point of contact for high-value clients, understanding their needs and offering personalized financial solutions to help them achieve their goals.",
		requirements: [
			"Minimum of 3 years of experience in a client-facing financial role.",
			"Excellent interpersonal, communication, and negotiation skills.",
			"Strong knowledge of banking products (loans, investments, accounts).",
		],
	},
	{
		title: "Data Scientist (Risk Modeling)",
		department: "Risk Management",
		description:
			"Develop and deploy machine learning models to predict credit risk, detect fraud, and optimize operational efficiency across the bank.",
		requirements: [
			"Master's degree in a quantitative field (CS, Math, Statistics).",
			"3+ years of experience in Python, R, and machine learning frameworks.",
			"Experience with large-scale data processing (Spark, SQL).",
		],
	},
	{
		title: "Compliance Officer",
		department: "Legal / Compliance",
		description:
			"Ensure the bank's operations comply with all local, federal, and international financial regulations (e.g., KYC, AML).",
		requirements: [
			"5+ years in a regulatory compliance role within the finance sector.",
			"In-depth knowledge of banking laws and regulatory reporting.",
			"Attention to detail and strong organizational skills.",
		],
	},
	{
		title: "DevOps Engineer",
		department: "Technology / Infrastructure",
		description:
			"Manage, maintain, and optimize our cloud infrastructure (AWS/GCP), focusing on CI/CD pipelines, automation, and system reliability (SRE).",
		requirements: [
			"4+ years of experience with cloud infrastructure (AWS/GCP).",
			"Expertise in infrastructure as code (Terraform, Ansible).",
			"Strong knowledge of containerization (Docker, Kubernetes).",
		],
	},
	{
		title: "Telesales Representative",
		department: "Sales / Retail",
		description:
			"Proactively reach out to potential and existing clients to promote our new financial products and services, managing a robust sales pipeline.",
		requirements: [
			"1+ year of experience in a high-volume telesales or call center environment.",
			"Exceptional persuasive communication skills.",
			"Proven track record of meeting and exceeding sales targets.",
		],
	},
]

export default function JobOpeningSection() {
	const ref = useRef<HTMLElement>(null)
	const isInView = useInView(ref, { amount: 0.3 })

	return (
		<motion.section
			ref={ref}
			className="container mx-auto py-12 font-lex flex flex-col gap-12 items-center lg:items-start"
			initial="hidden"
			animate={isInView ? "visible" : "hidden"}
		>
			<SectionIntro
				title={<>Job Openings</>}
				description="Explore exciting job openings at YourBank, where we value talent, innovation, and a passion for customer service. Join our team and be part of shaping a brighter future in the banking industry."
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<OpeningCard isInView={isInView} />
			</div>
		</motion.section>
	)
}

function OpeningCard({ isInView }: { isInView: boolean }) {
	return (
		<>
			{jobOpenings.map((job, index) => (
				<motion.article
					// @ts-expect-errors variant issue
					variants={AnimateInFromBottomVariants}
					initial="hidden"
					animate={isInView ? "visible" : "hidden"}
					custom={index}
					key={index}
					className="text-sm relative bg-gray-80 p-6 rounded-xl flex flex-col w-full h-full gap-10 hover:bg-gray-70 duration-300 ease-in-out cursor-pointer transition-all"
				>
					<div className="flex flex-col gap-2">
						<h3 className="font-bold text-xl text-white">
							{job.title}
						</h3>
						<div className="flex flex-wrap gap-4">
							<span className="bg-gray-90 rounded-full text-xs flex p-1 font-medium">
								Location: Boston
							</span>
							<span className="bg-gray-90 rounded-full text-xs flex p-1 font-medium">
								Department: {job.department}
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<h4 className="text-white font-bold text-xl mb-2">
							About This Job
						</h4>
						<p>{job.description}</p>
					</div>

					<div className="flex flex-col gap-2 mb-16">
						<h4 className="text-white font-bold text-xl mb-2">
							Key Requirements
						</h4>
						<ul className="list-disc space-y-2.5">
							{job.requirements.map((req, reqIdx) => (
								<ol
									className="flex items-center gap-2"
									key={reqIdx}
								>
									<Image
										src={"/images/icons/requirements.svg"}
										alt={req}
										width={32}
										height={32}
										className="flex shrink-0 w-5"
									/>
									<span className="flex">{req}</span>
								</ol>
							))}
						</ul>
					</div>
					<button className="absolute bottom-6 px-12 mt-4 default-button">
						Apply
					</button>
				</motion.article>
			))}
		</>
	)
}
