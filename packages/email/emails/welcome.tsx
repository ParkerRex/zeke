import {
	Body,
	Container,
	Heading,
	Img,
	Link,
	Preview,
	Text,
} from "@react-email/components";
import { getEmailUrl } from "@zeke/utils/envs";
import { Footer } from "../components/footer";
import { GetStarted } from "../components/get-started";
import { Logo } from "../components/logo";
import {
	EmailThemeProvider,
	getEmailInlineStyles,
	getEmailThemeClasses,
} from "../components/theme";

interface Props {
	fullName: string;
}

const baseUrl = getEmailUrl();

export const WelcomeEmail = ({ fullName = "" }: Props) => {
	const firstName = fullName ? fullName.split(" ").at(0) : "";
	const text = `${firstName ? `Hi ${firstName}, ` : ""}Welcome to Zeke! You're about to transform how you discover and apply insights from the content that matters.`;
	const themeClasses = getEmailThemeClasses();
	const lightStyles = getEmailInlineStyles("light");

	return (
		<EmailThemeProvider preview={<Preview>{text}</Preview>}>
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
						className={`text-[21px] font-normal text-center p-0 my-[30px] mx-0 ${themeClasses.heading}`}
						style={{ color: lightStyles.text.color }}
					>
						Welcome to Zeke
					</Heading>

					<br />

					<span
						className={`font-medium ${themeClasses.text}`}
						style={{ color: lightStyles.text.color }}
					>
						{firstName ? `Hi ${firstName},` : "Hello,"}
					</span>
					<Text
						className={themeClasses.text}
						style={{ color: lightStyles.text.color }}
					>
						Welcome to Zeke! You've just joined the fastest way to turn sprawling
						content into verified insights and ready-to-use outputs.
						<br />
						<br />
						We built Zeke because we were drowning in content—10-hour podcasts,
						dense research papers, endless YouTube videos—and missing what
						actually mattered. Now you can go from 10 hours to 5 minutes without
						missing the insights that move your business forward.
						<br />
						<br />
						Here's what you can do right now:{" "}
						<br />
						• Paste any link (podcast, YouTube, paper) and get an instant brief
						<br />
						• See every claim backed by timestamps and receipts
						<br />
						• Apply insights directly to your SOPs and goals
						<br />
						• Create cited content that's ready to ship
						<br />
						<br />
						If there's anything we can do to help you get started, just reply.
						We're here to make research effortless.
					</Text>

					<br />

					<Img
						src={`${baseUrl}/email/founders.jpeg`}
						alt="Founders"
						className="my-0 mx-auto block w-full"
					/>

					<Text
						className={themeClasses.mutedText}
						style={{ color: lightStyles.mutedText.color }}
					>
						Best regards, founders
					</Text>

					<style>{`
            .signature-blend {
              filter: none;
            }

            /* Regular dark mode - exclude Outlook.com */
            @media (prefers-color-scheme: dark) {
              .signature-blend:not([class^="x_"]) {
                filter: invert(1) brightness(1);
              }
            }

            /* Outlook.com specific dark mode targeting */
            [data-ogsb] .signature-blend,
            [data-ogsc] .signature-blend,
            [data-ogac] .signature-blend,
            [data-ogab] .signature-blend {
              filter: invert(1) brightness(1);
            }
          `}</style>

					<Img
						src={`${baseUrl}/email/signature.png`}
						alt="Signature"
						className="block w-full w-[143px] h-[20px] signature-blend"
					/>

					<br />
					<br />

					<GetStarted />

					<br />

					<Footer />
				</Container>
			</Body>
		</EmailThemeProvider>
	);
};

export default WelcomeEmail;
