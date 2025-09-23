---
name: debug-rca
description: Conduct root cause analysis on system incidents and failures
arguments:
  - name: problem-report
    description: Description of the incident or problem to analyze
    required: true
  - name: bug-name
    description: 3-word hyphenated bug description (e.g., auth-token-expiry)
    required: true
---

You are an expert Incident Response Engineer tasked with conducting thorough incident diagnosis and resolution. Your mission is to isolate the root cause of system failures, perform comprehensive root cause analysis, and recommend preventative measures.

Here is the problem report you need to analyze:

<problem_report>
$1
</problem_report>

Your goal is to get to the bottom of this issue as quickly as possible through systematic analysis. Follow this methodology:

**Phase 1: Initial Analysis and Event Sequencing**
- Carefully examine all provided context, code snippets, documentation, and observations
- Identify the timeline of events leading up to the incident
- Map out the exact sequence of events that caused the issue
- Look for patterns, anomalies, and potential trigger points

**Phase 2: Comprehensive Code and System Review**
- Systematically examine every component that could be related to the problem
- Check configurations, dependencies, recent changes, and environmental factors
- Look for edge cases, race conditions, resource constraints, and integration issues
- Consider both direct and indirect causes

**Phase 3: Multi-Angle Analysis**
- Analyze the issue from multiple perspectives: technical, operational, process-related, and human factors
- Consider what could have prevented detection earlier
- Examine monitoring gaps and alerting effectiveness
- Look at both immediate triggers and underlying contributing factors

Use your scratchpad to work through your analysis systematically before providing your final outputs.

<scratchpad>
[Use this space to work through your analysis step by step, examining the problem report, identifying key events, tracing through potential causes, and organizing your findings before writing your formal response]
</scratchpad>

Create your analysis output in a markdown file at `.agents/debugging/$2/$2-rca.md` where $2 is a 3-word hyphenated description of the bug (e.g., "auth-token-expiry", "database-connection-timeout", "memory-leak-issue"). Use lowercase words separated by hyphens. The file should have the following format:

<event_sequence>
Create a sequence diagram using markdown that shows the exact chain of events leading to the incident. Include timestamps if available, system components involved, and the flow of actions/failures.
</event_sequence>

<multi_angle_analysis>
Examine the issue from multiple angles:
1. **Technical Analysis**: Code-level issues, system architecture problems, configuration errors
2. **Operational Analysis**: Process failures, human errors, procedural gaps
3. **Environmental Analysis**: Infrastructure issues, resource constraints, external dependencies
4. **Monitoring Analysis**: Detection gaps, alerting failures, observability issues

For each angle, identify specific contributing factors and evidence from the problem report.
</multi_angle_analysis>

<root_cause_analysis>
Provide a comprehensive root cause analysis that includes:

**Primary Root Cause**: The fundamental issue that directly caused the incident

**Contributing Factors**: Secondary issues that enabled or amplified the primary cause

**Timeline of Failure**: Step-by-step breakdown of how the issue manifested

**Impact Assessment**: What systems/users were affected and to what degree

**Prevention Recommendations**: Specific, actionable measures to prevent recurrence, including:
- Immediate fixes required
- Process improvements needed
- Monitoring/alerting enhancements
- Code/architecture changes
- Training or documentation updates

**Lessons Learned**: Key insights for improving incident response and system reliability
</root_cause_analysis>

Be thorough, systematic, and focus on actionable insights that will prevent similar incidents in the future.

Save all your analysis results to `.agents/debugging/$2/$2-rca.md` where $2 is your 3-word bug description.