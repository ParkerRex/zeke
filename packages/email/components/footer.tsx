import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { getEmailUrl } from "@zeke/utils/envs";
import { LogoFooter } from "./logo-footer";
import { getEmailInlineStyles, getEmailThemeClasses } from "./theme";

const baseUrl = getEmailUrl();

export function Footer() {
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  return (
    <Section className="w-full">
      <Hr
        className={themeClasses.border}
        style={{ borderColor: lightStyles.container.borderColor }}
      />

      <br />

      <Text
        className={`text-[21px] font-regular ${themeClasses.text}`}
        style={{ color: lightStyles.text.color }}
      >
        Run your business smarter.
      </Text>

      <br />

      <Row>
        <Column
          style={{ width: "33%", paddingRight: "10px", verticalAlign: "top" }}
        >
          <Text
            className={`font-medium ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Features
          </Text>
          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://go.midday.ai/bOp4NOx"
            style={{ color: lightStyles.mutedText.color }}
          >
            Overview
          </Link>
          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://go.midday.ai/VFcNsmQ"
            style={{ color: lightStyles.mutedText.color }}
          >
            Inbox
          </Link>

          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://go.midday.ai/x7Fow9L"
            style={{ color: lightStyles.mutedText.color }}
          >
            Tracker
          </Link>
          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://go.midday.ai/fkYXc95"
            style={{ color: lightStyles.mutedText.color }}
          >
            Invoice
          </Link>
          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://zekehq.com/pricing"
            style={{ color: lightStyles.mutedText.color }}
          >
            Pricing
          </Link>
          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://zekehq.com/download"
            style={{ color: lightStyles.mutedText.color }}
          >
            Download
          </Link>
        </Column>

        <Column
          style={{ width: "33%", paddingRight: "10px", verticalAlign: "top" }}
        >
          <Text
            className={`font-medium ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Resources
          </Text>
          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://zekehq.com"
            style={{ color: lightStyles.mutedText.color }}
          >
            Homepage
          </Link>
          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://github.com/zekehq"
            style={{ color: lightStyles.mutedText.color }}
          >
            Github
          </Link>
          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://zekehq.com/support"
            style={{ color: lightStyles.mutedText.color }}
          >
            Support
          </Link>
          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://zekehq.com/terms"
            style={{ color: lightStyles.mutedText.color }}
          >
            Terms of service
          </Link>
          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://zekehq.com/privacy"
            style={{ color: lightStyles.mutedText.color }}
          >
            Privacy policy
          </Link>
        </Column>

        <Column style={{ width: "33%", verticalAlign: "top" }}>
          <Text
            className={`font-medium ${themeClasses.text}`}
            style={{ color: lightStyles.text.color }}
          >
            Company
          </Text>
          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://zekehq.com/updates"
            style={{ color: lightStyles.mutedText.color }}
          >
            Updates
          </Link>
          <Link
            className={`text-[14px] block mb-1.5 ${themeClasses.mutedLink}`}
            href="https://go.midday.ai/M2Hv420"
            style={{ color: lightStyles.mutedText.color }}
          >
            OSS Friends
          </Link>
        </Column>
      </Row>

      <br />
      <br />

      <Row>
        <Column className="align-middle w-[40px]">
          <Link href="https://x.com/zekehq">
            <Img
              src={`${baseUrl}/email/x.png`}
              width="18"
              height="18"
              alt="Zeke on X"
            />
          </Link>
        </Column>
        {/* <Column className="align-middle w-[40px]">
          <Link href="https://go.midday.ai/7rhA3rz">
            <Img
              src={`${baseUrl}/email/producthunt.png`}
              width="22"
              height="22"
              alt="Zeke on Producthunt"
            />
          </Link>
        </Column> */}
        {/* <Column className="align-middle">
          <Link href="https://go.midday.ai/Ct3xybK">
            <Img
              src={`${baseUrl}/email/linkedin.png`}
              width="22"
              height="22"
              alt="Zeke on LinkedIn"
            />
          </Link>
        </Column> */}
      </Row>

      <br />
      <br />

      <Text
        className={`text-xs ${themeClasses.secondaryText}`}
        style={{ color: lightStyles.secondaryText.color }}
      >
        Zeke Labs AB - West Palm Beach, FL, USA.
      </Text>

      <Link
        className={`text-[14px] block ${themeClasses.mutedLink}`}
        href="https://zekehq.com/settings/notifications"
        title="Unsubscribe"
        style={{ color: lightStyles.mutedText.color }}
      >
        Notification preferences
      </Link>

      <br />
      <br />

      <LogoFooter />
    </Section>
  );
}
