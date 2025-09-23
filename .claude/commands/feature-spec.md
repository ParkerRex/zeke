---
name: feature-spec
argument-hint: "[feature-description]"
description: Generate a comprehensive technical specification document for a new feature
allowed-tools: Bash(mkdir -p), Write
---

# Feature Technical Specification Generator

You are an expert technical product manager and solutions architect tasked with creating a comprehensive Technical Product Requirements Document (PRD) for a software feature.

## Input

Feature description: $1

## Process

1. Analyze the feature description and generate a 3-word kebab-case identifier (e.g., "user-auth-system", "payment-processing-api", "data-export-tool")

2. Create the directory structure: `.agents/features/[identifier]/`

3. Generate a comprehensive technical PRD and save it to: `.agents/features/[identifier]/[identifier]-tech-spec.md`

4. Output the path to the created file so it can be used with `/feature-plan`

## Technical PRD Structure

The document should include:

### Executive Summary
- Feature overview and primary purpose
- Key business value and expected impact
- High-level technical approach

### Problem Statement
- Current state and limitations
- User pain points with examples
- Business impact of not solving
- Market/competitive considerations

### Goals and Objectives
- SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound)
- Key results and success indicators
- Short-term and long-term goals

### Target Users and Use Cases
- User personas and roles
- User journey maps
- Detailed use case scenarios
- Edge cases and exception flows

### Functional Requirements
- User stories format: "As a [user], I want [functionality] so that [benefit]"
- Unique IDs (FR-001, FR-002, etc.)
- Primary flows, alternative paths, error scenarios
- Testable acceptance criteria
- Authentication, authorization, data validation, error handling

### Technical Requirements
- **Technology Stack**: Languages, frameworks, libraries
- **Platform Requirements**: OS, browsers, devices
- **Development Environment**: Tools, IDEs, build systems
- **Deployment Environment**: Cloud/on-premise, containers
- **Scalability**: Concurrent users, data volume, growth
- **Availability**: Uptime SLA, disaster recovery, backups
- **Compatibility**: Backward compatibility, version support

### System Architecture
- **Architecture Pattern**: Microservices, monolithic, serverless, etc.
- **Component Diagram**: System components and relationships
- **Data Flow**: How data moves through the system
- **Technology Choices**: Specific tech for each component
- **Communication Protocols**: REST, GraphQL, WebSockets, queues
- **Caching Strategy**: Cache layers, TTL, invalidation
- **State Management**: Session handling, distributed state

### Data Requirements
- **Data Models**: Entity relationships, schemas
- **Database Design**: Tables, indexes, relationships
- **Data Storage**: Primary DB, caching, file storage
- **Data Volume**: Growth, retention policies
- **Data Migration**: From existing systems if applicable
- **Data Privacy**: PII handling, encryption

### API Specifications
For each endpoint:
```
Endpoint: [METHOD] /path
Purpose: [Description]
Request:
  - Headers: [Required headers]
  - Body: [JSON schema/example]
  - Query Parameters: [Optional params]
Response:
  - Success (200): [Response schema]
  - Error Codes: [Possible errors]
Rate Limiting: [Limits]
Authentication: [Auth method]
```

### Security Requirements
- **Authentication**: OAuth, JWT, SAML, etc.
- **Authorization**: RBAC, ABAC, permissions
- **Data Encryption**: TLS, algorithms
- **Input Validation**: Sanitization, injection prevention
- **Audit Logging**: What to log, retention
- **Compliance**: GDPR, HIPAA, PCI-DSS, etc.
- **Security Testing**: Penetration testing, scanning

### Performance Requirements
- **Response Time**: P50, P95, P99 latency
- **Throughput**: Requests per second
- **Concurrent Users**: Expected and peak
- **Data Processing**: Batch times, real-time needs
- **Resource Utilization**: CPU, memory, storage limits
- **Network Requirements**: Bandwidth, latency

### Integration Requirements
- **Third-party Services**: APIs, SDKs
- **Internal Systems**: Dependencies
- **Data Exchange**: JSON, XML, Protocol Buffers
- **Integration Patterns**: Sync/async, webhooks
- **Error Handling**: Retry logic, circuit breakers
- **Version Management**: API versioning

### Testing Strategy
- **Unit Testing**: Coverage, frameworks
- **Integration Testing**: API, contract testing
- **Performance Testing**: Load testing
- **Security Testing**: Vulnerability scanning
- **User Acceptance**: Test scenarios
- **Regression Testing**: Automated suites

### Success Metrics and KPIs
- **Business Metrics**: Revenue, cost savings, efficiency
- **Technical Metrics**: Performance, error rates, uptime
- **User Metrics**: Adoption, satisfaction, completion
- **Quality Metrics**: Defect density, coverage, tech debt

### Risk Assessment
- **Technical Risks**: Technology, complexity, performance
- **Integration Risks**: Third-party dependencies
- **Security Risks**: Vulnerabilities, breaches
- **Business Risks**: Market changes, resources
- **Mitigation Strategies**: Specific actions
- **Contingency Plans**: Fallback approaches

### Dependencies and Constraints
- **External Dependencies**: Third-party services, APIs
- **Internal Dependencies**: Teams, systems, projects
- **Technical Constraints**: Platform limitations
- **Business Constraints**: Budget, timeline, regulatory
- **Assumptions**: Key design assumptions

## Output

Create a complete technical PRD that:
- Provides enough detail for architects to create implementation plans
- Gives developers clear specifications to build against
- Enables QA teams to create comprehensive test plans
- Allows DevOps to plan infrastructure and deployment
- Helps security teams assess and address risks

Save the completed specification to `.agents/features/[identifier]/[identifier]-tech-spec.md`

After saving, output: "✅ Created tech spec: `.agents/features/[identifier]/[identifier]-tech-spec.md`"

Then provide the command for the next step:
"📋 To create an implementation plan, run: `/feature-plan .agents/features/[identifier]/[identifier]-tech-spec.md`"