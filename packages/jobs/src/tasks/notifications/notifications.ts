import { getDb } from "@jobs/init";
import { notificationSchema } from "@jobs/schema";
import { schemaTask } from "@trigger.dev/sdk";
import { Notifications } from "@zeke/notifications";

export const notification = schemaTask({
	id: "notification",
	schema: notificationSchema,
	machine: "micro",
	maxDuration: 60,
	queue: {
		concurrencyLimit: 5,
	},
	run: async (payload) => {
		const notifications = new Notifications(getDb());

		const { type, teamId, sendEmail = false, ...data } = payload;

		return notifications.create(type, teamId, data, {
			sendEmail,
		});
	},
});
