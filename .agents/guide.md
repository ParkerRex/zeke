## From the Anthropic Dev

grep -r "user_preference" ~/.agent/memory/ | head -3 > context.md
find ~/.agent/tasks -name "*.pending" -mtime -7 | wc -l # 12 active tasks
cat ~/.agent/memory/2024-*/summary.json | jq '.insights[]' >> learning.md
echo "Context loaded: $(du -h context.md | cut -f1) from $(ls ~/.agent/memory | wc -l) sessions"




