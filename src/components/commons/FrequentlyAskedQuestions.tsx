/* eslint-disable react/no-unescaped-entities */
"use client"

import React, { useRef } from "react"
import { motion, useInView } from "framer-motion"
import SectionIntro from "./SectionIntro"
import { Marquee } from "@/components/ui/marquee"
import { Separator } from "../ui/separator"
import config from "@/config"

const contactEmail = config.SUPPORT

const faqs = [
	{
		title: `How do I open an account with ${config.TITLE}?`,
		description: (
			<span>
				Opening an account with {config.TITLE} is easy. Simply visit our
				website and click on the 'Open an Account' button. Follow the
				prompts, provide the required information, and complete the
				application process. If you have any questions or need
				assistance, our customer support team is available to help.
			</span>
		),
	},
	{
		title: "What documents do I need to provide to apply for a loan?",
		description: (
			<span>
				The documents required for a loan application may vary depending
				on the type of loan you are applying for. Generally, you will
				need to provide identification documents (such as a passport or
				driver's license), proof of income (such as pay stubs or tax
				returns), and information about the collateral (if applicable).
				Our loan officers will guide you through the specific
				requirements during the application process.
			</span>
		),
	},
	{
		title: "How can I access my accounts online?",
		description: (
			<span>
				Accessing your accounts online is simple and secure. Visit our
				website and click on the 'Login' button. Enter your username and
				password to access your accounts. If you haven't registered for
				online banking, click on the 'Enroll Now' button and follow the
				registration process. If you need assistance, our customer
				support team is available to guide you.
			</span>
		),
	},
	{
		title: "Are my transactions and personal information secure?",
		description: (
			<span>
				At {config.TITLE}, we prioritize the security of your transactions
				and personal information. We employ{" "}
				<b>industry-leading encryption</b> and{" "}
				<b>multi-factor authentication (MFA)</b> to ensure that your
				data is protected. Additionally, we regularly update our
				security measures to stay ahead of emerging threats. You can
				bank with confidence knowing that we have robust security
				systems in place.
			</span>
		),
	},
	{
		title: "How do I reset my online banking password?",
		description: (
			<span>
				If you forget your password, click the <b>'Forgot Password'</b>{" "}
				link on the login page. You will be prompted to verify your
				identity using the email or phone number associated with your
				account. Follow the on-screen instructions to create a new,
				secure password. For security reasons, if you have multiple
				failed attempts, your account may be temporarily locked.
			</span>
		),
	},
	{
		title: "What should I do if my debit card is lost or stolen?",
		description: (
			<span>
				Report a lost or stolen debit card immediately. You can do this
				by <b>logging into your online account</b> and selecting the
				'Report Lost/Stolen Card' option, or by calling our{" "}
				<b>24/7 support line</b> at [Insert Phone Number Here]. We will
				immediately cancel your existing card and arrange for a
				replacement card to be sent to you.
			</span>
		),
	},
	{
		title: "How long does it take for an online transfer to clear?",
		description: (
			<span>
				Transfers between {config.TITLE} accounts are usually{" "}
				<b>instantaneous</b>. Transfers to external banks (ACH
				transfers) typically take <b>1 to 3 business days</b>. Wire
				transfers are generally faster, often clearing within the same
				business day if submitted before the daily cutoff time of
				[Insert Cutoff Time].
			</span>
		),
	},
	{
		title: "What are the fees associated with my checking account?",
		description: (
			<span>
				We offer several checking account options with varying fee
				structures. Many of our accounts feature{" "}
				<b>no monthly maintenance fees</b> when you meet simple
				requirements, such as a minimum balance or direct deposit.
				Details on specific account fees, including overdraft and ATM
				fees, are clearly outlined in our <b>'Schedule of Fees'</b>{" "}
				document, available in the footer of our website.
			</span>
		),
	},
	{
		title: `Can I use my ${config.TITLE} debit card internationally?`,
		description: (
			<span>
				Yes, {config.TITLE} debit cards are accepted worldwide wherever
				[Visa/Mastercard] is accepted. We recommend notifying us of your
				travel dates and destinations through your online account's{" "}
				<b>'Travel Notice'</b> section to ensure uninterrupted service
				and prevent potential security blocks.
			</span>
		),
	},
	{
		title: "How do I set up automatic bill payments?",
		description: (
			<span>
				You can easily set up recurring bill payments through your
				online banking portal. Navigate to the <b>'Bill Pay'</b> tab,
				add your payee (the company or person you are paying), and set
				the payment amount, frequency, and start date. You will receive
				notifications for all upcoming and completed payments.
			</span>
		),
	},
	{
		title: "What is Multi-Factor Authentication (MFA) and how do I enable it?",
		description: (
			<span>
				Multi-Factor Authentication (MFA) requires you to provide{" "}
				<b>two or more verification factors</b> (like your password and
				a code sent to your phone) to log in. This significantly
				enhances security. You can enable MFA in the{" "}
				<b>'Security Settings'</b> section of your online banking
				profile.
			</span>
		),
	},
	{
		title: "What are the limits for daily ATM withdrawals and transfers?",
		description: (
			<span>
				Daily limits are set for both ATM withdrawals and online
				transfers for your protection. Standard ATM withdrawal limits
				are typically <b>$500 per day</b>, and daily online transfer
				limits vary by account type but generally range from{" "}
				<b>$5,000 to $10,000</b>. These limits can often be adjusted by
				contacting customer support.
			</span>
		),
	},
	{
		title: "How do I update my contact information (address, phone number, email)?",
		description: (
			<span>
				You can update most of your contact information directly through
				the <b>'Profile & Settings'</b> area of your online banking
				account. For security-sensitive changes, like your physical
				address, you may be required to verify your identity by speaking
				with a representative or submitting proof of address document.
			</span>
		),
	},
	{
		title: "Do you offer mobile check deposit?",
		description: (
			<span>
				Yes, our mobile app allows for convenient mobile check deposit.
				Simply log into the <b>{config.TITLE} mobile app</b>, select
				'Deposit Check,' and follow the prompts to take photos of the
				front and back of your endorsed check. Funds are typically
				available within 1-2 business days.
			</span>
		),
	},
	{
		title: "What are the interest rates for savings accounts and CDs?",
		description: (
			<span>
				Our current interest rates for all savings products,
				Certificates of Deposit (CDs), and money market accounts are
				published on the <b>'Rates'</b> page of our website. Please
				check this page or contact a representative, as rates are
				subject to change based on market conditions.
			</span>
		),
	},
	{
		title: "How do I dispute a transaction or fraudulent charge?",
		description: (
			<span>
				If you see an unfamiliar or unauthorized charge, log into your
				online account and navigate to the <b>'Transaction History'</b>{" "}
				page. Select the disputed transaction and click{" "}
				<b>'Dispute this Charge.'</b> Alternatively, call our fraud
				department immediately. We will launch an investigation and
				provide provisional credit where applicable.
			</span>
		),
	},
]

function FAQCard({
	title,
	description,
}: {
	title: string
	description: React.ReactNode
}) {
	return (
		<figure className="border-[0.5px] border-gray-70 w-full flex flex-col gap-6 p-6 rounded-xl">
			<span className="font-semibold text-white">{title}</span>
			<Separator className="w-full bg-gray-80" />
			<p className="text-sm">{description}</p>
		</figure>
	)
}

export default function FrequentlyAskedQuestions() {
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
				key={"faq"}
				title={
					<>
						Frequently{" "}
						<span className="text-white">Asked Questions</span>
					</>
				}
				description={`If you still have questions, please contact our team via ${contactEmail}`}
			/>

			<div className="relative max-h-[70vh] md:max-h-[50vh] overflow-hidden">
				<Marquee
					pauseOnHover
					vertical
					repeat={2}
					className="relative z-0 [--duration:60s md:--duration:30s] pt-6"
				>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{faqs.map((review, index) => (
							<FAQCard
								key={index}
								{...review}
							/>
						))}
					</div>
				</Marquee>
				<div className="h-32 bg-gradient-to-t from-gray-100/100 to-gray-100/40 w-full absolute bottom-0 left-0 right-0 z-10"></div>
			</div>
		</motion.section>
	)
}
