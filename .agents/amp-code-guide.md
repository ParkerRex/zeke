## From Amp Code
Agentic Coding Workflow

0. tasks
	•	Operating on a task basis. Store all intermediate context in markdown files in tasks// folders.
	•	Use semantic task id slugs

1. research
	•	Find existing patterns in this codebase
	•	Search internet if relevant
	•	Start by asking follow up questions to set the direction of research
	•	Report findings in research.md file

2. planning
	•	Read the research.md in tasks for .
	•	Based on the research come up with a plan for implementing the user request. We should reuse existing patterns, components and code where possible.
	•	If needed, ask clarifying questions to user to understand the scope of the task
	•	Write the comprehensive plan to plan.md. The plan should include all context required for an engineer to implement the feature.

3. implementation
	•	Read plan.md and create a todo–list with all items, then execute on the plan.
	•	Go for as long as possible. If ambiguous, leave all questions to the end and group them.

4. verification
	•	Once implementation is complete, you must verify that the implementation meets the requirements and is free of bugs.
	•	Do this by running tests, making tool calls and checking the output.
	•	If there are any issues, go back to the implementation step and make the necessary changes.
	•	Once verified, update the task status to “verified”.

