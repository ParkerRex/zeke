import { Tailwind } from "@react-email/tailwind";

export default function WelcomeEmail() {
  return (
    <Tailwind config={{ theme: {} }}>
      <div className="p-6">
        <h1 className="font-bold text-xl">Welcome to ZEKE</h1>
        <p className="mt-2 text-gray-700 text-sm">We’re glad you’re here.</p>
      </div>
    </Tailwind>
  );
}
