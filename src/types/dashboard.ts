import { z } from "zod"

export const analyticTableRowSchema = z.object({
    id: z.string(), // Use string for IDs (e.g., "total-balance")
    header: z.string(),
    value: z.string(), // Formatted value
    description: z.string().optional(),
    status: z.enum(["good", "warning", "critical", "info", "loading"]), // Specific statuses
    trend: z.string().optional(),
})

export type AnalyticTableRow = z.infer<typeof analyticTableRowSchema>