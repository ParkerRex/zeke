import { FaGithub } from "react-icons/fa";
import {
  FaDiscord,
  FaLinkedinIn,
  FaProductHunt,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const socialLinks = [
  {
    href: "https://twitter.com/zeke_hq",
    label: "X (Twitter)",
    icon: <FaXTwitter size={22} className="fill-[#878787]" />,
  },
  {
    href: "https://www.linkedin.com/company/zeke-hq",
    label: "LinkedIn",
    icon: <FaLinkedinIn size={22} className="fill-[#878787]" />,
  },
  {
    href: "https://discord.gg/BAbK8MsG2F",
    label: "Discord",
    icon: <FaDiscord size={24} className="fill-[#878787]" />,
  },
  {
    href: "https://github.com/zeke-ai/zeke",
    label: "GitHub",
    icon: <FaGithub size={22} className="fill-[#878787]" />,
  },
  {
    href: "https://www.producthunt.com/products/zeke",
    label: "Product Hunt",
    icon: <FaProductHunt size={22} className="fill-[#878787]" />,
  },
  {
    href: "https://www.youtube.com/@zekehq",
    label: "YouTube",
    icon: <FaYoutube size={22} className="fill-[#878787]" />,
  },
];

export function SocialLinks() {
  return (
    <ul className="flex space-x-4 items-center md:ml-5">
      {socialLinks.map(({ href, label, icon }) => (
        <li key={href}>
          <a target="_blank" rel="noreferrer" href={href}>
            <span className="sr-only">{label}</span>
            {icon}
          </a>
        </li>
      ))}
    </ul>
  );
}
