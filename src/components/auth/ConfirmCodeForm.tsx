"use client"

import React from "react"
import FormSection from "./FormSection"



export default function ConfirmCodeForm() {
	return (
		<FormSection
		title="Verify Your Email"
		description="Please input the token sent to you via email"
		form={""} />
	)
}
