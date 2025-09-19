"use server";

export async function fetchGithubStars() {
	const response = await fetch("https://api.github.com/repos/joivai/zeke", {
		next: {
			revalidate: 3600,
		},
	});

	return response.json();
}
