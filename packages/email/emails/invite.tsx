import {
	Body,
	Container,
	Heading,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import { getAppUrl } from "@zeke/utils/envs";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";
import {
	Button,
	EmailThemeProvider,
	getEmailInlineStyles,
	getEmailThemeClasses,
} from "../components/theme";

interface Props {
	email?: string;
	invitedByEmail?: string;
	invitedByName?: string;
	teamName?: string;
	ip?: string;
}

const baseAppUrl = getAppUrl();

export const InviteEmail = ({
	invitedByEmail = "bukinoshita@example.com",
	invitedByName = "Pontus Abrahamsson",
	email = "pontus@lostisland.co",
	teamName = "Acme Co",
	ip = "204.13.186.218",
}: Props) => {
	const inviteLink = `${baseAppUrl}/teams`;
	const themeClasses = getEmailThemeClasses();
	const lightStyles = getEmailInlineStyles("light");

	return (
		<EmailThemeProvider
			preview={<Preview>Join {teamName} on Zeke</Preview>}
		>
			<Body
				className={`my-auto mx-auto font-sans ${themeClasses.body}`}
				style={lightStyles.body}
			>
				<Container
					className={`my-[40px] mx-auto p-[20px] max-w-[600px] ${themeClasses.container}`}
					style={{
						borderStyle: "solid",
						borderWidth: 1,
						borderColor: lightStyles.container.borderColor,
					}}
				>
					<Logo />
					<Heading
						className={`mx-0 my-[30px] p-0 text-[24px] font-normal text-center ${themeClasses.heading}`}
						style={{ color: lightStyles.text.color }}
					>
						Join <strong>{teamName}</strong> on <strong>Zeke</strong>
					</Heading>

					<Text
						className={`text-[14px] leading-[24px] ${themeClasses.text}`}
						style={{ color: lightStyles.text.color }}
					>
						{invitedByName} (
						<Link
							href={`mailto:${invitedByEmail}`}
							className={`no-underline ${themeClasses.link}`}
							style={{ color: lightStyles.text.color }}
						>
							{invitedByEmail}
						</Link>
						) has invited you to join the <strong>{teamName}</strong>{" "}
						team on <strong>Zeke</strong> - the platform that transforms research into actionable insights.
					</Text>
					<Section className="mb-[42px] mt-[32px] text-center">
						<Button href={inviteLink}>Accept Invitation</Button>
					</Section>

					<Text
						className={`text-[14px] leading-[24px] break-all ${themeClasses.mutedText}`}
						style={{ color: lightStyles.mutedText.color }}
					>
						Or copy and paste this link in your browser:{" "}
						<Link
							href={inviteLink}
							className={`underline ${themeClasses.mutedLink}`}
							style={{ color: lightStyles.mutedText.color }}
						>
							{inviteLink}
						</Link>
					</Text>

					<br />
					<Section>
						<Text
							className={`text-[12px] leading-[24px] ${themeClasses.mutedText}`}
							style={{ color: lightStyles.mutedText.color }}
						>
							This invitation was sent to{" "}
							<span
								className={themeClasses.text}
								style={{ color: lightStyles.text.color }}
							>
								{email}
							</span>
							. The invitation was requested from{" "}
							<span
								className={themeClasses.text}
								style={{ color: lightStyles.text.color }}
							>
								{ip}
							</span>
							. If you were not expecting this invitation, you can ignore this email.
						</Text>
					</Section>

					<br />

					<Footer />
				</Container>
			</Body>
		</EmailThemeProvider>
	);
};

export default InviteEmail;
