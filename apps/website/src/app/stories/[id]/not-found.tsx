/**
 * Not found page for individual stories
 */

import { Button } from "@zeke/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@zeke/ui/card";
import { Icons } from "@zeke/ui/icons";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="container mx-auto py-20">
			<Card className="mx-auto max-w-2xl">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<Icons.FileQuestion className="h-6 w-6 text-muted-foreground" />
					</div>
					<CardTitle>Story Not Found</CardTitle>
					<CardDescription>
						The story you're looking for doesn't exist or may have been removed.
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4 text-center">
					<div className="space-y-2 text-muted-foreground text-sm">
						<p>• The story ID might be incorrect</p>
						<p>• The story may have been archived</p>
						<p>• Try searching for similar content</p>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
						<Button asChild>
							<Link href="/stories" className="flex items-center gap-2">
								<Icons.ArrowLeft className="h-4 w-4" />
								Back to Stories
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link href="/stories" className="flex items-center gap-2">
								<Icons.Search className="h-4 w-4" />
								Search Stories
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
