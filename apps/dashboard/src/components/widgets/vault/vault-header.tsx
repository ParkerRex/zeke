// TODO: This is for example purposes only from the Midday project
// We want to mimic the pattern and structure of this, but with the new tRPC and tool pattern.


import Link from "next/link";

export function VaultHeader() {
  return (
    <div className="mb-4">
      <Link href="/vault" prefetch>
        <h2 className="text-lg">Recent files</h2>
      </Link>
    </div>
  );
}
