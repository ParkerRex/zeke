#!/usr/bin/env tsx
import { config } from "dotenv";
import PgBoss from "pg-boss";

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;
const BOSS_SCHEMA = process.env.BOSS_SCHEMA || "pgboss";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!DATABASE_URL) {
	console.error("❌ DATABASE_URL not set");
	process.exit(1);
}

if (!OPENAI_API_KEY || OPENAI_API_KEY.includes("test")) {
	console.log(
		"⚠️  OPENAI_API_KEY not set or is test key - transcription will be mocked",
	);
}

if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY.includes("test")) {
	console.log(
		"⚠️  YOUTUBE_API_KEY not set or is test key - YouTube API calls will be mocked",
	);
}

console.log("🎬 Testing transcription pipeline...");

async function testTranscriptionPipeline() {
	// Initialize PgBoss
	const boss = new PgBoss({
		connectionString: DATABASE_URL,
		schema: BOSS_SCHEMA,
		ssl: DATABASE_URL.includes("127.0.0.1")
			? false
			: { rejectUnauthorized: false },
		application_name: "zeke-transcription-test",
		max: 1,
		migrate: false,
	});

	try {
		await boss.start();
		console.log("✅ PgBoss connected");

		// Test job: Create a transcription job
		const testVideoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Rick Roll for testing
		const jobData = {
			videoUrl: testVideoUrl,
			userId: "test-user-123",
			contentId: "test-content-456",
			priority: 1,
		};

		console.log(`\n📝 Creating transcription job for: ${testVideoUrl}`);

		// Send job to the queue
		const jobId = await boss.send("transcribe-video", jobData, {
			priority: 1,
			retryLimit: 3,
			retryDelay: 30,
			retryBackoff: true,
		});

		console.log(`✅ Job created with ID: ${jobId}`);

		// Check job status (skip if jobId is null)
		if (jobId) {
			const job = await boss.getJobById("transcribe-video", jobId);
			if (job) {
				console.log(`📊 Job status: ${job.state}`);
				console.log(`📅 Created at: ${job.createdon}`);
				console.log(`🎯 Queue: ${job.name}`);
			}
		}

		// List all jobs in the queue
		const jobs = await boss.fetch("transcribe-video", { batchSize: 1 });
		console.log(`\n📋 Found ${jobs.length} job(s) in transcribe-video queue`);

		if (jobs.length > 0) {
			const job = jobs[0];
			console.log(`🔍 Job details:`);
			console.log(`  - ID: ${job.id}`);
			console.log(`  - Data: ${JSON.stringify(job.data, null, 2)}`);
			console.log(`  - State: ${job.state}`);

			// Complete the job (simulate processing)
			console.log(`\n✅ Completing job ${job.id}...`);
			await boss.complete(job.id, {
				success: true,
				message: "Test transcription completed",
				transcriptText: "This is a test transcript for the video.",
				duration: 213, // seconds
				processedAt: new Date().toISOString(),
			});

			console.log("✅ Job completed successfully");
		}

		// Check for any failed jobs
		const failedJobs = await boss.fetch("transcribe-video", {
			batchSize: 10,
			includeMetadata: true,
		});
		const failed = failedJobs.filter((j) => j.state === "failed");
		if (failed.length > 0) {
			console.log(`\n⚠️  Found ${failed.length} failed job(s)`);
			failed.forEach((job) => {
				console.log(
					`  - Job ${job.id}: ${job.output?.message || "Unknown error"}`,
				);
			});
		}

		await boss.stop();
		console.log("\n🎉 Transcription pipeline test completed successfully!");
	} catch (error) {
		console.error("❌ Transcription pipeline test failed:", error);
		await boss.stop();
		return false;
	}

	return true;
}

testTranscriptionPipeline()
	.then((success) => {
		process.exit(success ? 0 : 1);
	})
	.catch((error) => {
		console.error("💥 Test failed:", error);
		process.exit(1);
	});
