/** Minimal CSV helpers shared by the statement and transaction exports. */

export function toCsv(rows: (string | number | null | undefined)[][]): string {
	return rows
		.map((row) =>
			row
				.map((cell) => {
					const value = cell === null || cell === undefined ? "" : String(cell)
					return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
				})
				.join(",")
		)
		.join("\r\n")
}

/** Triggers a browser download for generated text content. */
export function downloadTextFile(
	filename: string,
	content: string,
	mime: string = "text/csv;charset=utf-8"
): void {
	const blob = new Blob([content], { type: mime })
	const url = URL.createObjectURL(blob)
	const link = document.createElement("a")
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()
	link.remove()
	setTimeout(() => URL.revokeObjectURL(url), 1000)
}
