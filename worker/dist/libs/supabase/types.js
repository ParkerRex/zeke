export const Constants = {
    public: {
        Enums: {
            health_status: ["ok", "warn", "error"],
            pricing_plan_interval: ["day", "week", "month", "year"],
            pricing_type: ["one_time", "recurring"],
            subscription_status: [
                "trialing",
                "active",
                "canceled",
                "incomplete",
                "incomplete_expired",
                "past_due",
                "unpaid",
                "paused",
            ],
        },
    },
};
