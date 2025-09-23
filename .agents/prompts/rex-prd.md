Developer: Create a comprehensive product requirements document (PRD) for the specified project, following these guidelines:

- Start with a brief overview describing the project and the purpose of the document.
- Format all main section headings and subheadings in sentence case, except for the document title, which should be in title case.
- Follow the structure provided by the PRD outline (prd_outline), ensuring each section is included in the proper order.
- Under each main heading, include all relevant subheadings and fully elaborate based on the provided PRD instructions (prd_instructions). Do not omit any sections from prd_outline; fill each with relevant, specific, and detailed content.
- For every section:
  - Use clear and concise language, maintaining consistency and alignment with the purpose of the PRD.
  - Provide explicit details, including necessary metrics and any specifics required by the PRD instructions.
  - Ensure all aspects mentioned in each section are addressed with completeness—no vague or missing elements.
- When detailing user stories and acceptance criteria:
  - Enumerate all relevant user stories—including primary flows, alternative scenarios, and edge-case usages.
  - Assign a unique requirement ID to every user story (e.g., US-001, US-002) for traceability.
  - Include at least one user story for secure access or authentication, if access control is required by the project.
  - Each user story must be testable and paired with corresponding acceptance criteria.
  - Ensure exhaustive coverage; do not omit any potential user or system interaction.
- Do not proceed to final document creation until all above requirements and sections are complete.
- Think through the structure and content step-by-step before producing the final answer. Internally reason about which user stories, use cases, metrics, and constraints are required for completeness and coverage.
- Proceed iteratively—if you identify missing steps or unclear requirements, make reasonable assumptions, document them clearly, and continue.
- Final output should be a fully formatted PRD in markdown, with all headings, subheadings, and sections titles as specified. Use proper enumeration for user stories and requirement IDs.

### Output Format

Produce the final PRD as a markdown document, including:
- Title in Title Case
- All sections as specified by prd_outline, with all required subheadings
- Sentence case for all headings except the title
- Numbered user stories with unique IDs and corresponding acceptance criteria bullet points
- Use tables where helpful for clarity (e.g., for requirement traceability or metrics)

### Example

**Input:**
prd_instructions: [Project-specific details, e.g. "Develop a mobile app for ordering office supplies."]
prd_outline:
- Document Title
- Overview
- Objectives
- User Stories
- Acceptance Criteria
- Use Cases
- Metrics and Success Criteria
- Constraints and Assumptions
- Out of Scope

**Output Example (Shortened, Real Output Should Be More Detailed):**

# Office Supplies Ordering App PRD

## overview
The purpose of this document is to define the requirements for a mobile app enabling employees to order office supplies efficiently...

## objectives
- Streamline order requests
- Reduce fulfillment delays...

## user stories
- US-001: As an employee, I want to browse available supplies so I can see what I can order.
- US-002: As an employee, I want to log in securely so that my orders are linked to my department.
...

## acceptance criteria
- US-001:
  - User can view all available items in a list
  - List is searchable by name or category
  ...
- US-002:
  - Login screen enforces company SSO authentication
  - Failed logins return a specific error message
  ...

(etc.—for a real PRD, flesh out all sections, provide full coverage and details, use placeholders for any project-specific data as needed.)

---

**REMINDER:**
Your objective is to create a fully detailed, well-structured PRD according to the steps above, with all required content filled out, using clear and consistent markdown formatting per prd_outline and prd_instructions. User stories must be exhaustive and each include requirements IDs and testable acceptance criteria.