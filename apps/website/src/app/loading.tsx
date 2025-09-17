/**
 * Loading state for the homepage
 */

import { Card, CardContent, CardHeader } from "@zeke/ui/card";
import { Skeleton } from "@zeke/ui/skeleton";

export default function Loading() {
	return (
		<div className="container mx-auto py-4">
			<div className="grid grid-cols-12 gap-4">
				{/* Left: main content */}
				<div className="col-span-12 space-y-4 lg:col-span-8">
					{/* Top Stories Section Skeleton */}
					<section>
						<div className="mb-2 flex items-center justify-between">
							<Skeleton className="h-8 w-32" />
							<Skeleton className="h-4 w-20" />
						</div>
						<div className="mb-4 space-y-[2px]">
							<Skeleton className="h-[2px] w-full" />
							<Skeleton className="h-[2px] w-full" />
							<Skeleton className="h-[1px] w-full" />
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{Array.from({ length: 6 }).map((_, i) => (
								<Card key={i} className="overflow-hidden">
									<CardContent className="p-3">
										<div className="mb-2 flex items-start justify-between">
											<Skeleton className="h-4 w-20" />
										</div>
										<CardHeader className="p-0 pb-2">
											<Skeleton className="h-5 w-full" />
											<Skeleton className="h-5 w-3/4" />
										</CardHeader>
										<div className="mb-3 flex items-center justify-between gap-3">
											<Skeleton className="h-1 flex-1" />
											<Skeleton className="h-4 w-16" />
										</div>
										<Skeleton className="h-[150px] w-full rounded" />
									</CardContent>
								</Card>
							))}
						</div>
					</section>

					{/* Latest Stories Section Skeleton */}
					<section className="mt-8">
						<Skeleton className="mb-2 h-8 w-40" />
						<div className="mb-4 space-y-[2px]">
							<Skeleton className="h-[2px] w-full" />
							<Skeleton className="h-[2px] w-full" />
							<Skeleton className="h-[1px] w-full" />
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
							{Array.from({ length: 6 }).map((_, i) => (
								<Card key={i} className="overflow-hidden">
									<CardContent className="p-3">
										<div className="mb-2 flex items-start justify-between">
											<Skeleton className="h-4 w-20" />
										</div>
										<CardHeader className="p-0 pb-2">
											<Skeleton className="h-5 w-full" />
											<Skeleton className="h-5 w-2/3" />
										</CardHeader>
										<div className="mb-3 flex items-center justify-between gap-3">
											<Skeleton className="h-1 flex-1" />
											<Skeleton className="h-4 w-16" />
										</div>
										<Skeleton className="h-[150px] w-full rounded" />
									</CardContent>
								</Card>
							))}
						</div>
					</section>
				</div>

				{/* Right: sidebar */}
				<aside className="col-span-12 space-y-4 lg:col-span-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={i}>
							<CardHeader className="pb-3">
								<Skeleton className="h-5 w-24" />
							</CardHeader>
							<CardContent className="space-y-3">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-4 w-1/2" />
							</CardContent>
						</Card>
					))}
				</aside>
			</div>

			{/* Full-width sections skeleton */}
			<div className="mt-8 space-y-8">
				<Card className="mx-auto max-w-2xl">
					<CardHeader className="text-center">
						<Skeleton className="mx-auto h-12 w-12 rounded-full" />
						<Skeleton className="mx-auto h-6 w-48" />
						<Skeleton className="mx-auto h-4 w-64" />
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<div className="space-y-2">
							<Skeleton className="mx-auto h-4 w-56" />
							<Skeleton className="mx-auto h-4 w-48" />
							<Skeleton className="mx-auto h-4 w-52" />
						</div>
						<div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
							<Skeleton className="h-10 w-32" />
							<Skeleton className="h-10 w-24" />
						</div>
					</CardContent>
				</Card>

				<div className="overflow-hidden rounded-md border">
					<div className="bg-background px-4 py-8">
						<div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 sm:grid-cols-4">
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i}>
									<Skeleton className="mb-3 h-3 w-20" />
									<div className="space-y-3">
										{Array.from({ length: 4 }).map((_, j) => (
											<Skeleton key={j} className="h-4 w-full" />
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
