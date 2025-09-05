#!/usr/bin/env tsx
import { config } from "dotenv";
import { Pool } from "pg";
import PgBoss from "pg-boss";

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;
const BOSS_SCHEMA = process.env.BOSS_SCHEMA || "pgboss";

if (!DATABASE_URL) {
	console.error("❌ DATABASE_URL not set");
	process.exit(1);
}

console.log("🔍 Testing database connection...");
console.log(`📍 Schema: ${BOSS_SCHEMA}`);
console.log(`🔗 URL: ${DATABASE_URL.replace(/:[^:@]*@/, ":***@")}`);

async function testConnection() {
	// Test basic PostgreSQL connection
	console.log("\n1️⃣ Testing PostgreSQL connection...");
	const pool = new Pool({
		connectionString: DATABASE_URL,
		ssl: DATABASE_URL.includes("127.0.0.1")
			? false
			: { rejectUnauthorized: false },
		max: 1,
	});

	try {
		const client = await pool.connect();
		const result = await client.query("SELECT version()");
		console.log(
			"✅ PostgreSQL connected:",
			result.rows[0].version.split(" ")[0],
		);
		client.release();
	} catch (error) {
		console.error("❌ PostgreSQL connection failed:", error);
		return false;
	} finally {
		await pool.end();
	}

	// Test PgBoss schema
	console.log("\n2️⃣ Testing PgBoss schema...");
	const bossPool = new Pool({
		connectionString: DATABASE_URL,
		ssl: DATABASE_URL.includes("127.0.0.1")
			? false
			: { rejectUnauthorized: false },
		max: 1,
	});

	try {
		const client = await bossPool.connect();
		const schemaResult = await client.query(
			`SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
			[BOSS_SCHEMA],
		);

		if (schemaResult.rows.length === 0) {
			console.log("⚠️  PgBoss schema not found - run migrations first");
		} else {
			console.log("✅ PgBoss schema exists");

			// Check for PgBoss tables
			const tablesResult = await client.query(
				`SELECT table_name FROM information_schema.tables WHERE table_schema = $1`,
				[BOSS_SCHEMA],
			);
			console.log(
				`📊 Found ${tablesResult.rows.length} tables in ${BOSS_SCHEMA} schema`,
			);
		}

		client.release();
	} catch (error) {
		console.error("❌ Schema check failed:", error);
		return false;
	} finally {
		await bossPool.end();
	}

	// Test PgBoss initialization
	console.log("\n3️⃣ Testing PgBoss initialization...");
	try {
		const boss = new PgBoss({
			connectionString: DATABASE_URL,
			schema: BOSS_SCHEMA,
			ssl: DATABASE_URL.includes("127.0.0.1")
				? false
				: { rejectUnauthorized: false },
			application_name: "zeke-worker-test",
			max: 1,
			migrate: false, // Don't migrate in test
		});

		await boss.start();
		console.log("✅ PgBoss initialized successfully");

		// Test job creation
		const jobId = await boss.send("test-job", { message: "Connection test" });
		console.log(`✅ Test job created: ${jobId}`);

		await boss.stop();
		console.log("✅ PgBoss stopped cleanly");
	} catch (error) {
		console.error("❌ PgBoss initialization failed:", error);
		return false;
	}

	console.log("\n🎉 All connection tests passed!");
	return true;
}

testConnection()
	.then((success) => {
		process.exit(success ? 0 : 1);
	})
	.catch((error) => {
		console.error("💥 Test failed:", error);
		process.exit(1);
	});
