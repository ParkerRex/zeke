---
status: resolved
priority: p1
issue_id: "002"
tags: [security, xss, frontend]
dependencies: []
---

# XSS Vulnerability via dangerouslySetInnerHTML

## Problem Statement
The application uses `dangerouslySetInnerHTML` with syntax highlighting output in MDX components without proper sanitization. This could allow XSS attacks if blog content is user-generated or comes from untrusted sources.

## Findings
- Using `dangerouslySetInnerHTML` without sanitization
- Location: `apps/website/src/components/mdx.tsx:72`
- Location: `apps/website/src/app/blog/[slug]/page.tsx:59`
- HTML from syntax highlighter rendered directly
- No Content Security Policy to mitigate XSS

## Proposed Solutions

### Option 1: DOMPurify Sanitization (Recommended)
- **Implementation**: Add DOMPurify to sanitize HTML before rendering
- **Pros**:
  - Maintains current syntax highlighting
  - Easy to implement
  - Well-tested library
  - Configurable allowed tags/attributes
- **Cons**:
  - Adds dependency
  - Small performance overhead
- **Effort**: Small (< 2 hours)
- **Risk**: Low

### Option 2: Safe Syntax Highlighter
- **Implementation**: Use a highlighter that doesn't require innerHTML
- **Pros**:
  - No sanitization needed
  - Potentially better performance
- **Cons**:
  - May require changing highlighting library
  - Could affect styling
- **Effort**: Medium
- **Risk**: Medium

## Recommended Action
Implement DOMPurify sanitization

## Technical Details
- **Affected Files**:
  - `apps/website/src/components/mdx.tsx`
  - `apps/website/src/app/blog/[slug]/page.tsx`
- **Related Components**: MDX rendering, blog system
- **Database Changes**: No

## Resources
- DOMPurify: https://github.com/cure53/DOMPurify
- OWASP XSS Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

## Acceptance Criteria
- [ ] Install and configure DOMPurify
- [ ] Sanitize all HTML before using dangerouslySetInnerHTML
- [ ] Add Content Security Policy headers
- [ ] Test with malicious payloads
- [ ] Verify syntax highlighting still works
- [ ] No XSS vulnerabilities in blog content

## Work Log

### 2025-10-28 - Initial Discovery
**By:** Claude Triage System
**Actions:**
- Identified XSS risk in MDX components
- Found unsanitized dangerouslySetInnerHTML usage
- Categorized as P1 (CRITICAL) security issue

**Learnings:**
- Syntax highlighting often requires innerHTML
- Sanitization is critical for user-generated content
- CSP provides defense in depth

## Notes
Source: Security analysis triage session on 2025-10-28
Critical security vulnerability - immediate fix required