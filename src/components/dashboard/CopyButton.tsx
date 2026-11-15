"use client"

import { useState } from "react"

export default function CopyButton({
	value,
	label = "Copy",
}: {
	value: string
	label?: string
}) {
	const [copied, setCopied] = useState(false)

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(value)
			setCopied(true)
			setTimeout(() => setCopied(false), 1600)
		} catch {
			setCopied(false)
		}
	}

	return (
		<button
			type="button"
			onClick={copy}
			className="text-[10px] font-medium uppercase tracking-[0.15em] text-green-80 transition-colors duration-300 hover:text-green-70"
		>
			{copied ? "Copied" : label}
		</button>
	)
}
