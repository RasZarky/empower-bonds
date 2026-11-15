import Link from "next/link"
import { RiBankCardLine, RiChat3Line, RiMailLine } from "react-icons/ri"

const contactOptions = [
	{
		label: "Email support",
		value: "support@empowerbonds.com",
		hint: "Replies within one business day",
		href: "mailto:support@empowerbonds.com",
		icon: <RiMailLine className="h-4 w-4" />,
	},
	{
		label: "Secure message",
		value: "Message your specialist",
		hint: "Escalated accounts get a named contact",
		href: "mailto:support@empowerbonds.com?subject=Secure%20message",
		icon: <RiChat3Line className="h-4 w-4" />,
	},
]

const faqs = [
	{
		question: "How do I freeze my card?",
		answer:
			"Open Cards, choose the card and switch its status to frozen. Payments are declined immediately and you can unfreeze it just as fast.",
	},
	{
		question: "Why was my transfer declined?",
		answer:
			"Transfers need the 4-digit secret code you set at sign-up. Three incorrect attempts lock the transfer for 30 minutes for your protection.",
	},
	{
		question: "When are statements available?",
		answer:
			"A statement is finalised on the first day of the following month. Every closed period can be downloaded as CSV from the Statements page.",
	},
	{
		question: "How long do transfers take?",
		answer:
			"Transfers between your own accounts are instant. Payments to other banks usually arrive the same business day.",
	},
	{
		question: "Can I raise my card limits?",
		answer:
			"Daily ATM and spending limits can be reviewed with a specialist. Higher limits are applied after a short affordability check.",
	},
]

export default async function SupportPage() {
	return (
		<>
			<header className="flex flex-col gap-2">
				<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-green-80">
					Support
				</p>
				<h1 className="text-2xl md:text-3xl font-semibold text-white">We are here to help</h1>
				<p className="text-sm text-gray-20">
					Reach a banking specialist, or find the answer to the questions we hear most.
				</p>
			</header>

			<section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{contactOptions.map((option) => (
					<a
						key={option.label}
						href={option.href}
						className="group flex flex-col gap-3 rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6 transition-colors duration-300 hover:border-green-80/50"
					>
						<span className="flex h-9 w-9 items-center justify-center rounded-full border-[0.5px] border-gray-70 bg-gray-80 text-green-80">
							{option.icon}
						</span>
						<span className="text-[10px] uppercase tracking-[0.2em] text-gray-30">
							{option.label}
						</span>
						<span className="text-sm font-medium text-white group-hover:text-green-80 transition-colors duration-300">
							{option.value}
						</span>
						<span className="text-[11px] text-gray-30">{option.hint}</span>
					</a>
				))}
			</section>

			<section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
				<div className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
					<h2 className="text-lg font-semibold text-white">Frequently asked questions</h2>
					<p className="pb-4 text-xs text-gray-30">Tap a question to expand the answer.</p>
					<div className="divide-y divide-gray-70 border-t border-gray-70">
						{faqs.map((faq) => (
							<details key={faq.question} className="group py-4">
								<summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm text-white transition-colors duration-300 hover:text-green-80">
									{faq.question}
									<span className="text-green-80 transition-transform duration-300 group-open:rotate-45">
										+
									</span>
								</summary>
								<p className="pt-2 text-xs leading-relaxed text-gray-30">{faq.answer}</p>
							</details>
						))}
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<div className="rounded-xl border-[0.5px] border-gray-70 bg-gray-90 p-6">
						<h2 className="text-sm font-semibold text-white">Card lost or stolen?</h2>
						<p className="pb-4 pt-1 text-xs text-gray-30">
							Freeze the card first — it takes one tap and stops new payments instantly.
						</p>
						<Link
							href="/dashboard/cards"
							className="flex items-center gap-2 text-xs font-medium text-green-80 transition-colors duration-300 hover:text-green-70"
						>
							<RiBankCardLine className="h-4 w-4" />
							Open my cards
						</Link>
					</div>

					<div className="rounded-xl border-[0.5px] border-green-80/25 bg-green-80/5 p-6">
						<h2 className="text-sm font-semibold text-white">Urgent fraud concern</h2>
						<p className="pb-4 pt-1 text-xs text-gray-20">
							If you do not recognise a payment, email our fraud team and we will review it
							with you straight away.
						</p>
						<a
							href="mailto:support@empowerbonds.com?subject=Fraud%20concern"
							className="inline-flex items-center gap-2 text-xs font-semibold text-green-80 transition-colors duration-300 hover:text-green-70"
						>
							<RiMailLine className="h-4 w-4" />
							Email fraud support
						</a>
					</div>
				</div>
			</section>
		</>
	)
}
