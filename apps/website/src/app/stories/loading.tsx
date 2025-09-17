/**
 * Loading state for stories page
 */

import { Skeleton } from "@zeke/ui/skeleton";

export default function Loading() {
	return (
		<div className="container mx-auto py-8">
			{/* Header skeleton */}
			<div className="mb-8">
				<Skeleton className="mb-2 h-8 w-64" />
				<Skeleton className="h-5 w-96" />
			</div>

			{/* Search skeleton */}
			<div className="mb-8">
				<Skeleton className="h-10 w-80" />
			</div>

			{/* Stories grid skeleton */}
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{Array.from({ length: 12 }).map((_, i) => (
					<div key={i} className="animate-pulse">
						<div className="overflow-hidden rounded-lg border bg-card">
							<div className="p-3">
								<Skeleton className="mb-2 h-4 w-20" />
								<div className="mb-2 space-y-2">
									<Skeleton className="h-5 w-full" />
									<Skeleton className="h-5 w-3/4" />
								</div>
								<div className="mb-3 flex items-center justify-between gap-3">
									<Skeleton className="h-1 flex-1" />
									<Skeleton className="h-4 w-16" />
								</div>
								<Skeleton className="h-[150px] w-full" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
