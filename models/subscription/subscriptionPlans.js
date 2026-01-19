import mongoose from "mongoose";

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // purely for UI display (Monthly, Quarterly, Yearly)
    intervalLabel: {
      type: String,
      required: true, // "Monthly", "3 Months", "Yearly"
    },

    durationDays: {
      type: Number,
      required: true, // 30, 90, 365
    },

    price: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "USD",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const SubscriptionPlan =  mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
export default SubscriptionPlan;
