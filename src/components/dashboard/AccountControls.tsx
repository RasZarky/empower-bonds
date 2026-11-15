"use client"

export function SetPrimaryButton({
	accountId,
	demo = false,
}: {
	accountId: string
	demo?: boolean
}) {
	return (
		<button
			type="button"
			disabled={demo}
			aria-label={`Set account ${accountId} as primary`}
			className="text-xs font-medium text-green-80 hover:text-green-70 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			Set as primary
		</button>
	)
}
