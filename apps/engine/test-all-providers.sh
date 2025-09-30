#!/bin/bash
# Comprehensive test for all content providers

echo "🚀 Testing All Zeke Engine Providers"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if engine is running
echo "🏥 Checking engine health..."
curl -s http://localhost:8787/health | jq '.'
echo ""

# Test 1: YouTube Provider
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}📹 Test 1: YouTube Provider${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
YOUTUBE_URL="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
echo "URL: $YOUTUBE_URL"
curl -s -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$YOUTUBE_URL\"}" \
  | jq '.data | {id, title, sourceType, contentType, duration, "viewCount": .metadata.viewCount}'
echo ""

# Test 2: RSS Provider
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}📰 Test 2: RSS Provider${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
RSS_URL="https://hnrss.org/newest?points=100"
echo "URL: $RSS_URL"
curl -s -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$RSS_URL\"}" \
  | jq '.data | {id, title, sourceType, contentType, "feedTitle": .metadata.feedTitle}'
echo ""

# Test 3: arXiv Provider
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}📄 Test 3: arXiv Provider${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
ARXIV_URL="https://arxiv.org/abs/1706.03762"
echo "URL: $ARXIV_URL (Attention Is All You Need)"
curl -s -X POST http://localhost:8787/ingest \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$ARXIV_URL\"}" \
  | jq '.data | {id, title, sourceType, contentType, "arxivId": .metadata.arxivId, "authors": .metadata.authors}'
echo ""

# Final health check
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}🏥 Final Health Check${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
curl -s http://localhost:8787/health | jq '.providers'
echo ""

echo "${GREEN}✅ All provider tests complete!${NC}"
