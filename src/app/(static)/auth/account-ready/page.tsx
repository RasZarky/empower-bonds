import Link from "next/link"
import type { Metadata } from "next"
import { RiCheckLine, RiTimeLine } from "react-icons/ri"
import config from "@/config"
import { startDemoSession } from "@/server/action/demoAction"

export const metadata: Metadata = {
	title: "Getting your account ready",
	description: `We are setting up your ${config.TITLE} account.`,
}

const steps = [
	"Your profile has been created.",
	"A verification email is on its way — open it to confirm your address.",
	"We are opening your first bank account and setting your preferences.",
]

export default function AccountReadyPage() {
	return (
		<section className="w-full flex flex-col items-center justify-center min-h-[50vh] pt-24">
			<div className="border-gray-70 border-[0.5px] w-full max-w-md lg:max-w-xl flex flex-col gap-8 p-12 rounded-xl bg-gray-90">
				<div className="flex flex-col items-center text-center gap-4">
					<span className="flex h-14 w-14 items-center justify-center rounded-full border-[0.5px] border-green-80/40 bg-green-80/10 text-green-80">
						<RiTimeLine className="h-6 w-6" />
					</span>
					<h1 className="text-2xl font-semibold text-green-80">
						Getting your account ready
					</h1>
					<p className="text-sm text-gray-20">
						Thanks for joining {config.TITLE}. We are putting the finishing touches on
						your account — this usually takes a few seconds.
					</p>
				</div>

				<ul className="flex flex-col gap-3">
					{steps.map((step) => (
						<li key={step} className="flex items-start gap-3 text-sm text-gray-20">
							<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-80/10 text-green-80">
								<RiCheckLine className="h-3 w-3" />
							</span>
							{step}
						</li>
					))}
				</ul>

				<div className="flex flex-col items-center gap-3">
					<Link href="/auth/login" className="default-button w-full max-w-[260px] text-center">
						Continue to sign in
					</Link>
					<form action={startDemoSession} className="w-full flex justify-center">
						<button
							type="submit"
							className="default-button-alt w-full max-w-[260px] text-white"
						>
							Explore the demo dashboard
						</button>
					</form>
					<p className="text-[11px] text-gray-30 text-center">
						You can sign in as soon as you have verified your email address.
					</p>
				</div>
			</div>
		</section>
	)
}
