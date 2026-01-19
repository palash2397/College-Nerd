import Joi from "joi";

import User from "../../models/user/user.js";
import SubscriptionPlan from "../../models/subscription/subscriptionPlans.js";
import UserSubscriptionPlan from "../../models/subscription/userSubscriptionPlan.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";

export const createSubscriptionPlanHandle = async (req, res) => {
  try {
    const { name, description, label, durationDays, price, currency } =
      req.body;
    console.log(req.body);
    const schema = Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      label: Joi.string().required(),
      durationDays: Joi.number().required(),
      price: Joi.number().required(),
      currency: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const plan = await SubscriptionPlan.create({
      name,
      description,
      intervalLabel: label,
      durationDays,
      price,
      currency,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, plan, Msg.SUBSCRIPTION_PLAN_ADDED));
  } catch (error) {
    console.error("Create plan error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const deleteSubscriptionPlanHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const plan = await SubscriptionPlan.findByIdAndDelete(id);
    if (!plan) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.SUBSCRIPTION_PLAN_NOT_FOUND));
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, { id: plan._id }, Msg.SUBSCRIPTION_PLAN_DELETED),
      );
  } catch (error) {
    console.error("Create plan error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getAllPlansHandle = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).select(
      "-__v -updatedAt",
    );

    if (!plans || plans.length == 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.SUBSCRIPTION_PLAN_NOT_FOUND));
    }
    return res.status(200).json(new ApiResponse(200, plans, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Get all plans error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

// export const updateSubscriptionPlanHandle

export const subscribeToPlanHandle = async (req, res) => {
  try {
    const { planId } = req.params;
    const schema = Joi.object({
      planId: Joi.string().required(),
    });

    const { error } = schema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const plan = await SubscriptionPlan.findOne({
      _id: planId,
      isActive: true,
    });

    if (!plan) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.SUBSCRIPTION_PLAN_NOT_FOUND));
    }

    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
    );

    let subscription = await UserSubscriptionPlan.findOne({
      user: req.user.id,
    });

    if (subscription) {
      subscription.plan = plan._id;
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.status = "active";
    } else {
      subscription = new UserSubscriptionPlan({
        user: req.user.id,
        plan: plan._id,
        startDate,
        endDate,
        status: "active",
      });
    }

    await subscription.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          plan: {
            id: plan._id,
            name: plan.name,
            interval: plan.intervalLabel,
            price: plan.price,
          },
          startDate,
          endDate,
        },
        Msg.SUBSCRIPTION_ACTIVATED,
      ),
    );
  } catch (error) {
    console.error("Subscribe error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getMySubscriptionHandle = async (req, res) => {
  try {
    
    const now = new Date();

    const subscription = await UserSubscriptionPlan.findOne({ user: req.user.id  })
      .populate("plan", "name intervalLabel price durationDays");

    if (!subscription) {
      return res.status(200).json(
        new ApiResponse(
          200,
          { hasSubscription: false },
          Msg.SUBSCRIPTION_INACTIVE
        )
      );
    }

    // Auto-expire
    if (subscription.status === "active" && subscription.endDate < now) {
      subscription.status = "expired";
      await subscription.save();
    }

    const remainingDays =
      subscription.status === "active"
        ? Math.ceil(
            (subscription.endDate - now) / (1000 * 60 * 60 * 24)
          )
        : 0;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          hasSubscription: subscription.status === "active",
          status: subscription.status,
          plan: subscription.plan,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          remainingDays,
        },
        Msg.DATA_FETCHED
      )
    );
  } catch (error) {
    console.error("Get subscription error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};