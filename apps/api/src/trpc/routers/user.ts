import { updateUserSchema, userSchema } from "@api/schemas/users";
import { resend } from "@api/services/resend";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { TRPCError } from "@trpc/server";
import {
  deleteUser,
  getUserById,
  getUserInvites,
  updateUser,
} from "@zeke/db/queries";

export const userRouter = createTRPCRouter({
  me: protectedProcedure
    .output(userSchema)
    .query(async ({ ctx: { db, session } }) => {
      const user = await getUserById(db, session.user.id);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return user;
    }),

  update: protectedProcedure
    .input(updateUserSchema)
    .output(userSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      const user = await updateUser(db, {
        id: session.user.id,
        ...input,
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user",
        });
      }

      return user;
    }),

  delete: protectedProcedure.mutation(
    async ({ ctx: { supabase, db, session } }) => {
      const [data] = await Promise.all([
        deleteUser(db, session.user.id),
        supabase.auth.admin.deleteUser(session.user.id),
        resend.contacts.remove({
          email: session.user.email!,
          audienceId: process.env.RESEND_AUDIENCE_ID!,
        }),
      ]);

      return data;
    },
  ),

  invites: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    if (!session.user.email) {
      return [];
    }

    return getUserInvites(db, session.user.email);
  }),
});
