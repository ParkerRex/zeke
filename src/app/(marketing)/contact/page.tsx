import { Button } from "@/components/ui/button";

export const dynamic = "force-static";

const email = "me@parkerrex.com";
const subject = encodeURIComponent("ZEKE: Contact");
const body = encodeURIComponent(
  "I clicked the contact button on your site to reach out about"
);
const mailto = `mailto:${email}?subject=${subject}&body=${body}`;

export default function ContactPage() {
  return (
    <section className="rounded-lg bg-white px-4 py-16">
      <h1 className="mb-6 text-center">Contact</h1>
      <div className="mx-auto max-w-xl space-y-6 text-center text-gray-700">
        <p>
          Reach out to the ZEKE team at Minton Holdings LLC. We&apos;re happy to
          chat about pricing, partnerships, or anything else.
        </p>
        <div className="flex justify-center">
          <Button asChild size="lg" variant="default">
            <a href={mailto}>Email Us</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
