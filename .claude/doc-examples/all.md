All Prompts from Code Blocks in Claude Code Documentation
Understanding New Codebases
> give me an overview of this codebase > explain the main architecture patterns used here > what are the key data models? > how is authentication handled?
Finding Relevant Code
> find the files that handle user authentication > how do these authentication files work together? > trace the login process from front-end to database
Bug Fixing
> I'm seeing an error when I run npm test > suggest a few ways to fix the @ts-ignore in user.ts > update user.ts to add the null check you suggested
Refactoring Code
> find deprecated API usage in our codebase > suggest how to refactor utils.js to use modern JavaScript features > refactor utils.js to use ES2024 features while maintaining the same behavior > run tests for the refactored code
Specialized Subagents
> /agents > review my recent code changes for security issues > run all tests and fix any failures > use the code-reviewer subagent to check the auth module > have the debugger subagent investigate why users can't log in
Plan Mode
> I need to refactor our authentication system to use OAuth2. Create a detailed migration plan. > What about backward compatibility? > How should we handle database migration?
Working with Tests
> find functions in NotificationsService.swift that are not covered by tests > add tests for the notification service