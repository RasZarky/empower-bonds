import type { Metadata } from "next"
import LegalPage from "@/components/legal/LegalPage"
import config from "@/config"

export const metadata: Metadata = {
	title: "Terms of Service",
	description: `The terms that govern your use of ${config.TITLE} accounts and online banking services.`,
}

export default function TermsOfServicePage() {
	return (
		<LegalPage
			title="Terms of Service"
			updated="November 14, 2026"
			intro={`These terms form the agreement between you and ${config.TITLE} for the use of our website and online banking services. By opening an account or signing in, you accept them.`}
			sections={[
				{
					heading: "Eligibility",
					body: [
						"You must be at least 18 years old and legally able to enter into a contract to hold an account with us. You agree to give accurate, complete information and to keep it up to date.",
					],
				},
				{
					heading: "Your account and credentials",
					body: [
						"You are responsible for activity carried out with your sign-in details, secret code and devices. Keep them confidential, use a unique password, and tell us immediately if you believe someone else has access to your account.",
					],
					bullets: [
						"Do not share your password or secret code with anyone, including people claiming to be from the bank.",
						"Sign out of shared devices and review your signed-in devices regularly.",
						"We may suspend access where we detect unusual activity or a legal requirement.",
					],
				},
				{
					heading: "Payments and transfers",
					body: [
						"Transfers between your own accounts are processed immediately. Payments to other banks are sent the same business day where possible and may be delayed for fraud checks. Once a payment has been sent it may not be possible to recall it.",
					],
				},
				{
					heading: "Fees and interest",
					body: [
						"Fees, interest rates and limits are shown in your account and on the relevant product page. We will give notice before changing them where the law requires it.",
					],
				},
				{
					heading: "Acceptable use",
					body: [
						"You agree not to use the service to break the law, launder money, fund prohibited activity, interfere with our systems, or access accounts that are not yours.",
					],
				},
				{
					heading: "Sample account and demonstration data",
					body: [
						"Some sign-in credentials on this site open a sample account that runs on local demonstration data. The sample account is read-only, is not a real bank account, and does not move real money or create a legal relationship with us.",
					],
				},
				{
					heading: "Intellectual property",
					body: [
						"The site, its design, text and software are owned by us or our licensors and are protected by intellectual property law. You may use them only as needed to use the service.",
					],
				},
				{
					heading: "Limitation of liability",
					body: [
						"We provide the service with reasonable care and skill. To the extent the law allows, we are not liable for indirect or consequential losses, or for losses caused by events outside our reasonable control. Nothing in these terms limits rights you have under consumer law.",
					],
				},
				{
					heading: "Ending the agreement",
					body: [
						"You may close your account at any time. We may close or suspend an account for breach of these terms, suspected fraud, or where required by law. Outstanding balances remain payable after closure.",
					],
				},
				{
					heading: "Governing law",
					body: [
						"These terms are governed by the laws of the jurisdiction in which your account is held, and disputes will be handled by the courts of that jurisdiction.",
					],
				},
				{
					heading: "Changes to these terms",
					body: [
						"We may update these terms from time to time. We will publish the updated version on this page and, for material changes, notify you before they take effect.",
					],
				},
			]}
		/>
	)
}
