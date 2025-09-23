---
name: debug-solution
description: Analyze incident RCA and design comprehensive technical solutions architecture
arguments:
  - name: rca-file
    description: Path to the root cause analysis markdown file
    required: true
---

You are an expert incident solutions architect. Your role is to analyze incident data and design comprehensive technical solutions that address identified system weaknesses and prevent future occurrences.

You will be provided with a root cause analysis from a recent incident. Your task is to create a detailed solutions architecture document in markdown format that addresses the issues identified.

Here is the root cause analysis file to analyze:
$1

First, read and analyze the RCA document at the provided path.

Before writing your final document, use the scratchpad to organize your analysis and planning:

<scratchpad>
First, analyze the root cause analysis to:
- Identify the primary technical issues and failure points
- Understand the system architecture and data flows involved
- Note any gaps in monitoring, alerting, or resilience
- Determine integration points and dependencies
- Assess the scope and complexity of required changes

Then, plan your solution architecture by considering:
- Technical design approaches that address each identified issue
- How the solution will integrate with existing systems
- Risk mitigation strategies and rollback plans
- Implementation phases and dependencies
- Monitoring and validation approaches
</scratchpad>

Now create a comprehensive solutions architecture document. Save your output to a file in the same directory as the RCA file, replacing `-rca.md` with `-solution.md`. For example, if the RCA is at `.agents/debugging/auth-token-expiry/auth-token-expiry-rca.md`, save your solution to `.agents/debugging/auth-token-expiry/auth-token-expiry-solution.md`.

Your document should include the following sections:

**1. Executive Summary**
- Brief overview of the incident and its impact
- High-level description of the proposed solution
- Key benefits and expected outcomes

**2. Problem Analysis**
- Detailed breakdown of the root causes identified
- Analysis of the sequence diagram and failure points
- Impact assessment on system reliability and performance

**3. Solution Architecture**
- Technical design overview with clear architectural diagrams (describe in text)
- Component specifications and their interactions
- Data flow improvements and system integration points
- Security and compliance considerations

**4. Technical Design Specifications**
- Detailed requirements for each solution component
- API specifications and interface definitions
- Database schema changes or additions
- Configuration and infrastructure requirements

**5. Integration & Deployment Plan**
- Step-by-step implementation approach
- Dependencies and prerequisites
- Rollback strategies and risk mitigation
- Testing and validation procedures
- Timeline and resource requirements

**6. Monitoring & Observability**
- Enhanced monitoring and alerting strategies
- Key performance indicators and success metrics
- Logging and tracing improvements
- Incident detection and response enhancements

**7. Risk Assessment & Mitigation**
- Potential risks during implementation
- Mitigation strategies for each identified risk
- Contingency plans and alternative approaches

Ensure your document is technically detailed, actionable, and clearly addresses all issues identified in the root cause analysis. Use proper markdown formatting with headers, bullet points, and code blocks where appropriate.