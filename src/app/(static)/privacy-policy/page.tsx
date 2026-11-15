import type { Metadata } from "next"
import LegalPage from "@/components/legal/LegalPage"
import config from "@/config"

export const metadata: Metadata = {
	title: "Privacy Policy",
	description: `How ${config.TITLE} collects, uses and protects your personal information.`,
}

export default function PrivacyPolicyPage() {
	return (
		<LegalPage
			title="Privacy Policy"
			updated="November 14, 2026"
			intro={`This policy explains what information ${config.TITLE} collects when you use our website and online banking services, how we use it, and the choices you have. It applies to every visitor and account holder.`}
			sections={[
				{
					heading: "Information we collect",
					body: [
						"We collect the information you give us directly, the information generated when you use your account, and limited technical information about the device you sign in from.",
					],
					bullets: [
						"Account details such as your name, email address, postal address and phone number.",
						"Identity and verification information required by financial regulations.",
						"Transaction history, balances, card activity and statements.",
						"Device, browser, IP address and sign-in times used to protect your account.",
					],
				},
				{
					heading: "How we use your information",
					body: [
						"We use your information to open and operate your accounts, process payments and transfers, provide statements, and keep your account secure.",
					],
					bullets: [
						"To verify your identity and meet legal and regulatory obligations.",
						"To detect, investigate and prevent fraud and unauthorised access.",
						"To respond to your support requests and service messages.",
						"To improve our products, features and website performance.",
					],
				},
				{
					heading: "Sharing information",
					body: [
						"We do not sell your personal information. We share it only with service providers who help us operate the bank (such as payment networks, identity verification and email delivery), with regulators and law enforcement where the law requires it, and with your consent.",
					],
				},
				{
					heading: "Cookies and similar technologies",
					body: [
						"We use strictly necessary cookies to keep you signed in, remember your display preferences and protect forms against cross-site request forgery. We do not use advertising cookies on the banking dashboard.",
					],
				},
				{
					heading: "Security",
					body: [
						"We protect your data with encrypted connections, hashed credentials, session controls and access logging. No method of transmission or storage is completely secure, so please keep your password and secret code private and tell us immediately if you suspect unauthorised activity.",
					],
				},
				{
					heading: "Retention",
					body: [
						"We keep account and transaction records for as long as your account is open and afterwards for the period required by financial record-keeping rules. When information is no longer needed we delete or anonymise it.",
					],
				},
				{
					heading: "Your rights",
					body: [
						"Depending on where you live, you may have the right to access, correct, export or delete your personal information, or to object to certain processing.",
					],
					bullets: [
						"Request a copy of the personal information we hold about you.",
						"Correct details that are inaccurate or out of date.",
						"Ask us to delete information we are not required to keep.",
						"Withdraw consent where processing relies on it.",
					],
				},
				{
					heading: "Changes to this policy",
					body: [
						"We may update this policy as our services or the law change. Material changes will be announced in your account or by email before they take effect.",
					],
				},
			]}
		/>
	)
}
