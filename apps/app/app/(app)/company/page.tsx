import CompanyPanel from "@/components/company/company-panel";

export default function CompanyPage() {
  return <CompanyPanel />;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company • ZEKE",
  description: "Explore company news and CEO updates.",
};
