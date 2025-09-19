import { resend } from "@jobs/utils/resend";
import { schemaTask } from "@trigger.dev/sdk";
import { InviteEmail } from "@zeke/email/emails/invite";
import { getI18n } from "@zeke/email/locales";
import { render } from "@zeke/email/render";
import { inviteTeamMembersSchema } from "@zeke/jobs/schema";
import { nanoid } from "nanoid";

export const inviteTeamMembers = schemaTask({
  id: "invite-team-members",
  schema: inviteTeamMembersSchema,
  maxDuration: 30,
  queue: {
    concurrencyLimit: 10,
  },
  run: async ({ ip, invites, locale }) => {
    const { t } = getI18n({ locale });

    const emails = invites?.map(async (invite) => ({
      from: "Zeke <middaybot@zeke.ai>",
      to: [invite.email],
      subject: t("invite.subject", {
        invitedByName: invite.invitedByName,
        teamName: invite.teamName,
      }),
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
      html: render(
        InviteEmail({
          invitedByEmail: invite.invitedByEmail,
          invitedByName: invite.invitedByName,
          email: invite.email,
          teamName: invite.teamName,
          ip,
          locale,
        }),
      ),
    }));

    const htmlEmails = await Promise.all(emails);

    await resend.batch.send(htmlEmails);
  },
});
