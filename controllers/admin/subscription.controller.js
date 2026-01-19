import Joi from "joi";

import User from "../../models/user/user.js";
import SubscriptionPlan from "../../models/subscription/subscriptionPlans.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";



export const createSubscriptionPlanHandle = async (req, res) => {
  try {
    const { name, label, durationDays, price, currency } = req.body;
    console.log(req.body)
    const schema = Joi.object({
      name: Joi.string().required(),
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
      intervalLabel: label,
      durationDays,
      price,
      currency,
    });

    return res.status(201).json(new ApiResponse(201, plan, Msg.SUBSCRIPTION_PLAN_ADDED));
  } catch (error) {
    console.error("Create plan error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const deleteSubscriptionPlanHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      id: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const plan = await SubscriptionPlan.findByIdAndDelete(id);
    if (!plan) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.SUBSCRIPTION_PLAN_NOT_FOUND));
    }

    return res.status(201).json(new ApiResponse(201, {id: plan._id}, Msg.SUBSCRIPTION_PLAN_DELETED));
  } catch (error) {
    console.error("Create plan error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getAllPlansHandle = async(req, res)=>{
  try {
    const plans = await SubscriptionPlan.find({ isActive: true}).select("-__v -updatedAt");
    return res.status(200).json(new ApiResponse(200, plans, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Get all plans error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
    
  }
}

