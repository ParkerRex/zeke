import 'dotenv/config';
import { runAnalyzeStory } from './analyze/llm.js';
import pool from './db.js';
/**
 * Test script to manually trigger analysis for existing stories
 * This helps verify that the LLM analysis fix is working
 */
async function testAnalysis() {
    try {
        console.log('🔍 Testing LLM analysis fix...');
        // Get a few stories that don't have overlays yet
        const { rows: stories } = await pool.query(`
      SELECT s.id, s.title, s.canonical_url 
      FROM stories s 
      LEFT JOIN story_overlays so ON s.id = so.story_id 
      WHERE so.story_id IS NULL 
      LIMIT 3
    `);
        if (stories.length === 0) {
            console.log('✅ No stories found without overlays - analysis might already be working!');
            // Check current counts
            const { rows: counts } = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM stories) as total_stories,
          (SELECT COUNT(*) FROM story_overlays) as total_overlays,
          (SELECT COUNT(*) FROM story_embeddings) as total_embeddings
      `);
            console.log('📊 Current counts:', counts[0]);
            return;
        }
        console.log(`📝 Found ${stories.length} stories without overlays:`);
        stories.forEach((story, i) => {
            console.log(`  ${i + 1}. ${story.title} (${story.id})`);
        });
        // Test analysis on each story
        for (const story of stories) {
            console.log(`\n🔄 Analyzing: ${story.title}`);
            try {
                await runAnalyzeStory(story.id);
                console.log(`✅ Analysis completed for: ${story.title}`);
            }
            catch (error) {
                console.error(`❌ Analysis failed for ${story.title}:`, error);
            }
        }
        // Check results
        console.log('\n📊 Checking results...');
        const { rows: results } = await pool.query(`
      SELECT 
        s.id,
        s.title,
        CASE WHEN so.story_id IS NOT NULL THEN '✅' ELSE '❌' END as has_overlay,
        CASE WHEN se.story_id IS NOT NULL THEN '✅' ELSE '❌' END as has_embedding,
        so.chili,
        so.confidence
      FROM stories s 
      LEFT JOIN story_overlays so ON s.id = so.story_id 
      LEFT JOIN story_embeddings se ON s.id = se.story_id 
      WHERE s.id = ANY($1::uuid[])
    `, [stories.map(s => s.id)]);
        console.log('\nResults:');
        results.forEach(result => {
            console.log(`  ${result.has_overlay} ${result.has_embedding} ${result.title}`);
            if (result.chili !== null) {
                console.log(`    🌶️  Chili: ${result.chili}, Confidence: ${result.confidence}`);
            }
        });
        // Final counts
        const { rows: finalCounts } = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM stories) as total_stories,
        (SELECT COUNT(*) FROM story_overlays) as total_overlays,
        (SELECT COUNT(*) FROM story_embeddings) as total_embeddings
    `);
        console.log('\n📊 Final counts:', finalCounts[0]);
        console.log('\n🎉 Test completed!');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
    }
    finally {
        await pool.end();
    }
}
// Run the test
testAnalysis().catch(console.error);
