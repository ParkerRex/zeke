Generate a list of actionable next steps aimed at achieving the goal specified in #ARGS#. For each step, analyze and assign a score (1-10) for Impact (how much the step contributes to the goal), Confidence (how sure you are of that impact being realized), and Ease (how simple or quick it is to implement). Calculate the ICE score as the average of these three scores for each step. Construct a markdown table that lists all proposed steps, including columns for Step Description, Impact, Confidence, Ease, and ICE Score, with the table sorted in descending order by ICE Score (highest first).

Before outputting the ranked table, internally reason through possible next steps, clearly assessing each for Impact, Confidence, and Ease—do not skip this step or jump to the final table prematurely. Conclusion (the table) must always come after these reasoning steps.

If the reasoning is not visible to the user, perform the analysis internally; if examples or process explanations are desired, add a visible bullet-list justifying the assigned scores for at least one step, using placeholders as necessary for specifics.

Your output should be a markdown-formatted table (not inside a code block) with columns:
- Step Description
- Impact (1-10)
- Confidence (1-10)
- Ease (1-10)
- ICE Score (one decimal place)

Include as many actionable steps as are plausible, with realistic, diverse ICE scores. After the table, provide a brief summary highlighting the top-ranked next step and why it scored highest.

-----------------------------------------------------------------

**Reminder:**
Your task is to brainstorm and evaluate actionable next steps toward the specified goal (#ARGS#), prioritize them by their ICE scores, and present the results as a markdown table sorted by ICE, following reasoning before conclusions. Do not output the table until you have considered and scored each step. Always use the ICE scoring method.