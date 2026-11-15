"use client"
import React from "react"
import Link from "next/link"
import { Separator } from "../ui/separator"
import { IoMail } from "react-icons/io5"
import Logo from "./Logo"
import config from "@/config"

// Navigation links configuration
const navLinks = [
	{ href: "/", label: "Home" },
	{ href: "/careers", label: "Careers" },
	{ href: "/about", label: "About" },
	{ href: "/security", label: "Security" },
]

// Contact information configuration
const contactInfo = [
	{
		href: `mailto:${config.SUPPORT}`,
		label: config.SUPPORT,
					icon: <IoMail className="w-4 h-4 text-green-80" />,
	},
]

// Legal links configuration
const legalLinks = [
	{ href: "/privacy-policy", label: "Privacy Policy" },
	{ href: "/terms-of-service", label: "Terms of Service" },
]

const Footer = () => {
	return (
		<footer className="bg-gray-90 text-gray-30 py-6 px-4 mt-12 w-screen">
			<div className="contain pt-4 flex flex-col items-center space-y-6">
				{/* Logo Section */}
				<div className="flex justify-center">
					<Logo />
				</div>

				{/* Navigation Links */}
				<NavigationLinks />

				<Separator className="w-full h-px bg-gray-80" />

				{/* Contact Information */}
				<ContactInfo />

				<Separator className="w-full h-px bg-gray-80" />

				{/* Footer Bottom Section */}
				<FooterBottom />
			</div>
		</footer>
	)
}

// Component for rendering navigation links
const NavigationLinks = () => (
	<div className="flex justify-center items-center gap-4 mt-4">
		{navLinks.map((link, index) => (
			<React.Fragment key={link.href}>
				<Link
					href={link.href}
					className="hover:text-white transition-colors duration-300"
				>
					{link.label}
				</Link>
				{index < navLinks.length - 1 && (
					<span className="text-sm">|</span>
				)}
			</React.Fragment>
		))}
	</div>
)

// Component for rendering contact information
const ContactInfo = () => (
	<div className="flex items-center py-4 flex-wrap justify-center gap-4">
		{contactInfo.map((contact, index) => (
			<React.Fragment key={contact.href}>
				<Link
					href={contact.href}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-2.5 hover:text-green-80 transition-colors duration-300"
				>
					{contact.icon}
					<span>{contact.label}</span>
				</Link>
				{index < contactInfo.length - 1 && (
					<span className="text-sm hidden lg:flex">|</span>
				)}
			</React.Fragment>
		))}
	</div>
)

// Component for rendering footer bottom (copyright, legal links)
const FooterBottom = () => (
	<div className="relative w-full rounded-xl lg:rounded-full bg-gray-100 p-4 flex flex-col lg:flex-row items-center text-center text-xs mt-4 lg:justify-between gap-4">
		{/* Copyright Notice */}
		<div className="flex w-fit">
			&copy;{" "}
			<span className="text-green-80">
				{new Date().getFullYear()} {config.TITLE}
			</span>
			. All rights reserved.
		</div>

		{/* Legal Links */}
		<div className="flex items-center gap-2">
			{legalLinks.map((link, index) => (
				<React.Fragment key={link.href}>
					<Link
						href={link.href}
						className="text-xs hover:text-white transition-colors duration-300"
					>
						{link.label}
					</Link>
					{index < legalLinks.length - 1 && (
						<span className="text-sm">|</span>
					)}
				</React.Fragment>
			))}
		</div>
	</div>
)

export default Footer
