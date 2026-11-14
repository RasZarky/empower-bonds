import config from "@/config"
import { BetterAuthResetPasswordEmailProps } from "@/types/auth"
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Text,
	Tailwind,
	Section,
} from "@react-email/components"

export const ResetPasswordEmail = ({
	username,
	token,
}: BetterAuthResetPasswordEmailProps) => {
	const previewText = `Reset your password`
	return (
		<Html>
			<Head />
			<Preview> {previewText} </Preview>
			<Tailwind>
				<Body className="bg-white my-auto mx-auto font-sans px-2">
					<Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
						<Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
							Reset your <strong> {config.TITLE} </strong>{" "}
							password
						</Heading>
						<Text className="text-black text-[14px] leading-[24px]">
							Hello {username},
						</Text>
						<Text className="text-black text-[14px] leading-[24px]">
							We received a request to reset your password for
							your {config.TITLE} account.If you didn&apos;t make
							this request, you can safely ignore this email.
						</Text>

						<Section className="text-center mt-[32px] mb-[32px]">
							<Button
								className="bg-[#000000] rounded-xl text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
								href={`${config.BASE_URL}/auth/reset-password?token=${token}`}
							>
								Reset Password
							</Button>
						</Section>
						<Text className="text-black text-[14px] leading-[24px]">
							Or copy and paste this URL into your browser:{" "}
							<Link
								href={`${config.BASE_URL}/auth/reset-password?token=${token}`}
								className="text-blue-600 no-underline"
							>
								{`${config.BASE_URL}/auth/reset-password?token=${token}`}
							</Link>
						</Text>
						<Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
						<Text className="text-[#666666] text-[12px] leading-[24px]">
							If you didn&apos;t request a password reset, please
							ignore this email or contact support if you have
							concerns.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}

export function reactResetPasswordEmail(
	props: BetterAuthResetPasswordEmailProps
) {
	return <ResetPasswordEmail {...props} />
}
