import UserSubscription from "../models/subscription/userSubscriptionPlan.js";
import ApiResponse from "../utils/ApiResponse.js";
import Msg from "../utils/responseMsg.js";

export const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const subscription = await UserSubscription.findOne({ user: userId });

    
    if (!subscription) {
      return res.status(403).json(
        new ApiResponse(
          403,
          {
            reason: "NO_SUBSCRIPTION",
          },
          Msg.SUBSCRIPTION_REQUIRED
        )
      );
    }


    if (subscription.status === "active" && subscription.endDate < now) {
      subscription.status = "expired";
      await subscription.save();

      return res.status(403).json(
        new ApiResponse(
          403,
          {
            reason: "SUBSCRIPTION_EXPIRED",
            expiredAt: subscription.endDate,
          },
          Msg.SUBSCRIPTION_EXPIRED
        )
      );
    }


    if (subscription.status !== "active") {
      return res.status(403).json(
        new ApiResponse(
          403,
          {
            reason: "SUBSCRIPTION_INACTIVE",
          },
          Msg.SUBSCRIPTION_INACTIVE
        )
      );
    }

    
    req.subscription = subscription; // useful later
    next();
  } catch (error) {
    console.error("Subscription middleware error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
