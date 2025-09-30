# Zeke v2.0 Release Notes - Research Dashboard

## Overview

Zeke v2.0 introduces a completely redesigned dashboard focused on research intelligence, replacing the previous Midday finance features with a comprehensive research assistant and insights platform.

## Major Features

### 🎯 Research-First Dashboard
- **Hero Modules**: New content modules for Stories, Highlights, Why It Matters, and Playbooks
- **Personalized Feed**: AI-curated insights based on your goals and interests
- **Real-time Pipeline Status**: Monitor content ingestion and processing
- **Quick Actions**: One-click source ingestion and playbook execution

### 🤖 Conversational Assistant
- **Persistent Chat History**: All conversations are saved and searchable
- **Research Tools**: Six specialized tools for story analysis, summarization, and brief creation
- **Streaming Responses**: Real-time message streaming with sub-200ms chunk latency
- **Canvas Artifacts**: Generate and interact with research artifacts directly in the UI

### 📊 Enhanced Analytics
- **Research Events**: Track dashboard views, assistant usage, and tool invocations
- **Usage Metrics**: Monitor team engagement with stories, insights, and playbooks
- **Feedback System**: Rate assistant responses to improve quality

### 🔒 Security & Compliance
- **RBAC System**: Role-based access control with Owner, Admin, Member, and Viewer roles
- **Audit Logging**: Comprehensive event tracking for all mutations
- **Rate Limiting**: Protect against abuse with configurable limits
- **Data Privacy**: All chat data is team-scoped and encrypted

## API Changes

### New TRPC Procedures
- `workspace.bootstrap`: Initial dashboard data
- `stories.dashboardSummaries`: Categorized story summaries
- `insights.personalizedFeed`: AI-curated insight feed
- `pipeline.dashboardStatus`: Ingestion pipeline metrics
- `pipeline.quickActions.*`: Quick action mutations
- `chats.*`: Complete chat management suite

### New REST Endpoints
- `POST /api/chat`: Streaming assistant endpoint with tool execution

### Deprecated APIs
- All Midday finance endpoints (`invoice.*`, `timer.*`, `expense.*`)
- Legacy thread management endpoints
- PDF extraction job endpoint (replaced by AI action)

## Performance Improvements
- **75% faster dashboard load**: Bootstrap P95 reduced from 2s to 450ms
- **90% reduction in API calls**: Single bootstrap query replaces 12 separate calls
- **50% smaller bundle**: Removed finance dependencies and optimized imports
- **Real-time streaming**: Chat responses start in <2s with consistent chunk delivery

## Database Changes

### New Tables
- `chats`: Chat session storage
- `chat_messages`: Message history with tool calls
- `chat_feedback`: User feedback on responses
- `research_events`: Analytics event tracking

### Removed Tables
- `threads`: Legacy chat system
- `thread_messages`: Legacy messages
- All finance-related tables

## Configuration

### Required Environment Variables
```bash
# AI Provider
OPENAI_API_KEY=sk-...

# API Connection
NEXT_PUBLIC_API_URL=https://api.zeke.ai

# Rate Limiting
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...

# Analytics
POSTHOG_API_KEY=...
```

### Optional Configuration
```bash
# Custom AI Model
AI_MODEL=gpt-4-turbo-preview

# Rate Limit Overrides
CHAT_RATE_LIMIT=60
TRPC_RATE_LIMIT=120

# Feature Flags
ENABLE_CANVAS_ARTIFACTS=true
ENABLE_PLAYBOOK_AUTOMATION=true
```

## Migration Guide

### For Developers

1. **Update Dependencies**
```bash
pnpm install
pnpm run db:migrate
```

2. **Environment Setup**
- Copy `.env.example` files from both `apps/api` and `apps/dashboard`
- Configure required environment variables
- Run database migrations

3. **Code Updates**
- Replace finance component imports with research equivalents
- Update TRPC queries to use new procedures
- Migrate from threads to chats API

### For Users

1. **Data Migration**
- Chat history is preserved but migrated to new schema
- Finance data is archived (contact support for export)
- Settings and preferences are maintained

2. **Feature Parity**
- Research tools replace manual data entry
- AI automation handles previously manual tasks
- Canvas artifacts provide richer interactions

## Breaking Changes

1. **Removed Features**
   - Invoice management
   - Expense tracking
   - Time tracking
   - Manual PDF extraction

2. **API Contract Changes**
   - All endpoints now require authentication
   - Response shapes have changed for all procedures
   - New error codes and rate limits

3. **UI Components**
   - Sidebar navigation restructured
   - Modal system completely replaced
   - Finance widgets removed

## Known Issues

- Chat streaming may experience delays on slow connections
- Canvas artifacts require modern browser support
- Some playbook automations are still in beta

## Rollback Procedure

If issues arise, rollback is available:

1. **Database Rollback**
```bash
pnpm run db:rollback
```

2. **Code Rollback**
```bash
git revert --no-commit HEAD~1
pnpm install
pnpm run build
```

3. **Environment Rollback**
- Restore previous environment variables
- Clear Redis cache
- Restart services

## Support

For issues or questions about the v2.0 release:
- GitHub Issues: https://github.com/zeke/app/issues
- Documentation: https://docs.zeke.ai/v2
- Discord: https://discord.gg/zeke

## Future Roadmap

### v2.1 (Q2 2025)
- Advanced playbook automation
- Multi-modal artifact support
- Team collaboration features

### v2.2 (Q3 2025)
- Custom tool development SDK
- Enterprise SSO support
- Advanced analytics dashboard

## Credits

This release represents months of work from the entire Zeke team. Special thanks to our beta testers and the open source community for their invaluable feedback.

---

*Released: September 2025*
*Version: 2.0.0*
*Codename: Research Phoenix*