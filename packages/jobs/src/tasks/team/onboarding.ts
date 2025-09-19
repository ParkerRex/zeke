import { onboardTeamSchema } from "@jobs/schema";
import { shouldSendEmail } from "@jobs/utils/check-team-plan";
import { resend } from "@jobs/utils/resend";
import { logger, schemaTask, wait } from "@trigger.dev/sdk";
import { GetStartedEmail } from "@zeke/email/emails/get-started";
import { TrialEndedEmail } from "@zeke/email/emails/trial-ended";
import { TrialExpiringEmail } from "@zeke/email/emails/trial-expiring";
import { WelcomeEmail } from "@zeke/email/emails/welcome";
import { render } from "@zeke/email/render";
import { createClient } from "@zeke/supabase/job";

export const onboardTeam = schemaTask({
  id: "onboard-team",
  schema: onboardTeamSchema,
  maxDuration: 300,
  run: async ({ userId }) => {
    const supabase = createClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, team_id")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!user.full_name || !user.email) {
      throw new Error("User data is missing");
    }

    const [firstName, lastName] = user.full_name.split(" ") ?? [];

    await resend.contacts.create({
      email: user.email,
      firstName,
      lastName,
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
    });

    await resend.emails.send({
      to: user.email,
      subject: "Welcome to Zeke",
      from: "Pontus from Zeke <pontus@zeke.ai>",
      html: render(
        WelcomeEmail({
          fullName: user.full_name,
        }),
      ),
    });

    if (!user.team_id) {
      logger.info("User has no team, skipping onboarding");
      return;
    }

    await wait.for({ days: 3 });

    if (await shouldSendEmail(user.team_id)) {
      await resend.emails.send({
        from: "Pontus from Zeke <pontus@zeke.ai>",
        to: user.email,
        subject: "Get the most out of Zeke",
        html: await render(
          GetStartedEmail({
            fullName: user.full_name,
          }),
        ),
      });
    }

    await wait.for({ days: 11 });

    if (await shouldSendEmail(user.team_id)) {
      await resend.emails.send({
        from: "Pontus from Zeke <pontus@zeke.ai>",
        to: user.email,
        subject: "Your trial is expiring soon",
        html: await render(
          TrialExpiringEmail({
            fullName: user.full_name,
          }),
        ),
      });
    }

    await wait.for({ days: 15 });

    if (await shouldSendEmail(user.team_id)) {
      await resend.emails.send({
        from: "Pontus from Zeke <pontus@zeke.ai>",
        to: user.email,
        subject: "Your trial has ended",
        html: await render(TrialEndedEmail({ fullName: user.full_name })),
      });
    }
  },
});
