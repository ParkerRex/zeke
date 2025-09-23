## From the Anthropic Dev

```bash
#!/bin/bash

# Extract user preferences from agent memory
grep -r "user_preference" ~/.agent/memory/ | head -3 > context.md

# Count active tasks from the last 7 days
find ~/.agent/tasks -name "*.pending" -mtime -7 | wc -l # 12 active tasks

# Extract insights from memory summaries
cat ~/.agent/memory/2024-*/summary.json | jq '.insights[]' >> learning.md

# Display context loading summary
echo "Context loaded: $(du -h context.md | cut -f1) from $(ls ~/.agent/memory | wc -l) sessions"
```




