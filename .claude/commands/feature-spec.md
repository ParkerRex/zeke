---
name: feature-spec
argument-hint: "[feature-description]"
description: Generate a comprehensive technical specification document for a new feature
allowed-tools: Bash(mkdir -p), Write
---

You are an expert technical product manager and solutions architect tasked with creating a comprehensive Technical Product Requirements Document (PRD) for a software feature.

<feature_description>
{{FEATURE_DESCRIPTION}}
</feature_description>

Your task is to analyze this feature description and generate a complete technical specification document that aligns with the existing project's technology stack and architectural patterns.

## Process Steps

Follow these steps in order:

1. **Analyze Existing Project Tech Stack**: First, examine the current project by looking for:
   - package.json, package-lock.json, pnpm-lock.yaml, bun.lockb, or similar dependency files
   - Existing code patterns, frameworks, and libraries in use
   - Current architectural patterns and coding conventions
   - Database technologies, API patterns, and deployment configurations

2. **Generate Feature Identifier**: Create a 2-word kebab-case identifier for this feature (e.g., "user-auth", "payment-processing", "data-export") based on the feature description.

3. **Create Directory Structure**: Use the mkdir command to create: `.agents/features/[identifier]/`

4. **Generate Technical PRD**: Create a comprehensive technical specification document and save it as: `.agents/features/[identifier]/[identifier]-tech-spec.md`

## Technical PRD Content Requirements

Your document must include all of the following sections with detailed content:

### Executive Summary
- Feature overview and primary purpose
- Key business value and expected impact
- High-level technical approach

### Problem Statement
- Current state and limitations
- User pain points with specific examples
- Business impact of not solving this problem
- Market/competitive considerations

### Goals and Objectives
- SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound)
- Key results and success indicators
- Short-term and long-term goals

### Target Users and Use Cases
- User personas and roles
- User journey maps
- Detailed use case scenarios with step-by-step flows
- Edge cases and exception handling scenarios

### Functional Requirements
- User stories in format: "As a [user], I want [functionality] so that [benefit]"
- Unique requirement IDs (FR-001, FR-002, etc.)
- Primary flows, alternative paths, and error scenarios
- Testable acceptance criteria for each requirement
- Authentication, authorization, data validation, and error handling requirements

### Technical Requirements
- **Technology Stack**: Build upon existing project technologies found in package files and codebase
- **Platform Requirements**: Operating systems, browsers, devices supported
- **Development Environment**: Tools, IDEs, build systems aligned with current project setup
- **Deployment Environment**: Cloud/on-premise specifications, containerization
- **Scalability**: Concurrent users, data volume, growth projections
- **Availability**: Uptime SLA, disaster recovery, backup strategies
- **Compatibility**: Backward compatibility, version support requirements

### System Architecture
- **Architecture Pattern**: Microservices, monolithic, serverless, etc.
- **Component Diagram**: System components and their relationships
- **Data Flow**: How data moves through the system
- **Technology Choices**: Specific technologies for each component
- **Communication Protocols**: REST, GraphQL, WebSockets, message queues
- **Caching Strategy**: Cache layers, TTL policies, invalidation strategies
- **State Management**: Session handling, distributed state management

### Data Requirements
- **Data Models**: Entity relationships and schemas
- **Database Design**: Tables, indexes, relationships
- **Data Storage**: Primary database, caching layers, file storage
- **Data Volume**: Expected growth and retention policies
- **Data Migration**: Requirements for migrating from existing systems
- **Data Privacy**: PII handling, encryption requirements

### API Specifications
For each API endpoint, provide:
```
Endpoint: [METHOD] /path
Purpose: [Description]
Request:
  - Headers: [Required headers]
  - Body: [JSON schema/example]
  - Query Parameters: [Optional parameters]
Response:
  - Success (200): [Response schema]
  - Error Codes: [Possible error responses]
Rate Limiting: [Rate limits]
Authentication: [Authentication method]
```

### Security Requirements
- **Authentication**: OAuth, JWT, SAML, or other methods
- **Authorization**: RBAC, ABAC, permission models
- **Data Encryption**: TLS requirements, encryption algorithms
- **Input Validation**: Sanitization, injection prevention
- **Audit Logging**: What to log, retention policies
- **Compliance**: GDPR, HIPAA, PCI-DSS, or other relevant standards
- **Security Testing**: Penetration testing, vulnerability scanning

### Performance Requirements
- **Response Time**: P50, P95, P99 latency targets
- **Throughput**: Requests per second capacity
- **Concurrent Users**: Expected and peak user loads
- **Data Processing**: Batch processing times, real-time requirements
- **Resource Utilization**: CPU, memory, storage limits
- **Network Requirements**: Bandwidth, latency specifications

### Integration Requirements
- **Third-party Services**: External APIs, SDKs, services
- **Internal Systems**: Dependencies on existing systems
- **Data Exchange**: Formats (JSON, XML, Protocol Buffers)
- **Integration Patterns**: Synchronous/asynchronous, webhooks
- **Error Handling**: Retry logic, circuit breakers, fallback mechanisms
- **Version Management**: API versioning strategies

### Testing Strategy
- **Unit Testing**: Coverage requirements, testing frameworks
- **Integration Testing**: API testing, contract testing
- **Performance Testing**: Load testing, stress testing
- **Security Testing**: Vulnerability scanning, penetration testing
- **User Acceptance Testing**: Test scenarios and criteria
- **Regression Testing**: Automated test suites

### Success Metrics and KPIs
- **Business Metrics**: Revenue impact, cost savings, efficiency gains
- **Technical Metrics**: Performance benchmarks, error rates, uptime
- **User Metrics**: Adoption rates, satisfaction scores, task completion
- **Quality Metrics**: Defect density, test coverage, technical debt

### Risk Assessment
- **Technical Risks**: Technology challenges, complexity, performance risks
- **Integration Risks**: Third-party dependencies, system integration
- **Security Risks**: Potential vulnerabilities, data breaches
- **Business Risks**: Market changes, resource constraints
- **Mitigation Strategies**: Specific actions for each risk
- **Contingency Plans**: Fallback approaches and alternatives

### Dependencies and Constraints
- **External Dependencies**: Third-party services, APIs, vendors
- **Internal Dependencies**: Other teams, systems, projects
- **Technical Constraints**: Platform limitations, legacy system constraints
- **Business Constraints**: Budget limitations, timeline constraints
- **Key Assumptions**: Critical assumptions underlying the design

## Critical Requirements

- **ALWAYS examine existing project files first** (package.json, lock files, codebase)
- **Recommend technologies already in use** when possible
- **Only suggest new dependencies when absolutely necessary**
- **Follow existing architectural patterns** found in the codebase
- **Provide sufficient detail** for architects, developers, QA, DevOps, and security teams

## Output Format

1. Create the directory structure using mkdir
2. Write the complete technical PRD to the specified file path
3. After saving the file, output exactly: "✅ Created tech spec: `.agents/features/[identifier]/[identifier]-tech-spec.md`"
4. Then provide the next step command: "📋 To create an implementation plan, run: `/feature-plan .agents/features/[identifier]/[identifier]-tech-spec.md`"

Your final output should only include the directory creation command, the file writing, the success message, and the next step command. Do not include any additional commentary or explanations beyond what is specified above.