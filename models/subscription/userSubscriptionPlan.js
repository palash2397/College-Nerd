import mongoose from "mongoose";

const UserSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one active subscription per user
      index: true,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

const UserSubscriptionPlan = mongoose.model("UserSubscription", UserSubscriptionSchema);
export default UserSubscriptionPlan;
