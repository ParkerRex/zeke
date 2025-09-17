"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/layout";

interface ErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function Error({ error, reset }: ErrorProps): JSX.Element {
	useEffect(() => {}, [error]);

	return (
		<div className="container mx-auto">
			<ErrorState
				title="Something went wrong"
				description="We encountered an error while loading the stories. This might be a temporary issue."
				onRetry={reset}
			>
				{process.env.NODE_ENV === "development" && (
					<details className="mt-4 text-left">
						<summary className="cursor-pointer font-medium text-sm">
							Error Details (Development)
						</summary>
						<pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
							{error.message}
							{error.stack && `\n\n${error.stack}`}
						</pre>
					</details>
				)}
			</ErrorState>
		</div>
	);
}
