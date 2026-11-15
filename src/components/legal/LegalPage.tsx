import config from "@/config"

export interface LegalSection {
	heading: string
	body: string[]
	bullets?: string[]
}

interface LegalPageProps {
	title: string
	updated: string
	intro: string
	sections: LegalSection[]
}

/** Shared shell for the Privacy Policy and Terms of Service pages. */
export default function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
	return (
		<article className="container mx-auto flex w-full max-w-3xl flex-col gap-8 py-10">
			<header className="flex flex-col gap-3">
				<p className="text-[10px] font-medium uppercase tracking-[0.2em] text-green-80">
					Legal
				</p>
				<h1 className="text-2xl font-semibold text-white md:text-3xl">{title}</h1>
				<p className="text-xs text-gray-30">Last updated: {updated}</p>
			</header>

			<p className="text-sm leading-relaxed text-gray-20">{intro}</p>

			<div className="flex flex-col gap-8">
				{sections.map((section) => (
					<section key={section.heading} className="flex flex-col gap-3">
						<h2 className="text-lg font-semibold text-white">{section.heading}</h2>
						{section.body.map((paragraph) => (
							<p key={paragraph} className="text-sm leading-relaxed text-gray-20">
								{paragraph}
							</p>
						))}
						{section.bullets && section.bullets.length > 0 && (
							<ul className="flex flex-col gap-2">
								{section.bullets.map((bullet) => (
									<li
										key={bullet}
										className="flex gap-3 text-sm leading-relaxed text-gray-20"
									>
										<span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-green-80" />
										<span>{bullet}</span>
									</li>
								))}
							</ul>
						)}
					</section>
				))}
			</div>

			<section className="flex flex-col gap-2 border-t border-gray-70 pt-6">
				<h2 className="text-lg font-semibold text-white">Questions</h2>
				<p className="text-sm leading-relaxed text-gray-20">
					Contact {config.TITLE} at{" "}
					<a
						href={`mailto:${config.SUPPORT}`}
						className="text-green-80 underline hover:text-green-70"
					>
						{config.SUPPORT}
					</a>{" "}
					and we will get back to you within one business day.
				</p>
			</section>
		</article>
	)
}
