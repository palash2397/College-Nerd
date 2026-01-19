import Joi from "joi";

import User from "../../models/user/user.js";
import SubscriptionPlan from "../../models/subscription/subscriptionPlans.js";
import Payment from "../../models/payment/payment.js";
import UserSubscriptionPlan from "../../models/subscription/userSubscriptionPlan.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import stripe from "../../utils/stripe/stripe.js"



export const createSubscriptionPaymentIntentHandle = async (req, res) => {
  try {
    
    const { planId } = req.params;

    const plan = await SubscriptionPlan.findOne({
      _id: planId,
      isActive: true,
    });

    if (!plan) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.SUBSCRIPTION_PLAN_NOT_FOUND));
    }

    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price * 100,
      currency: plan.currency.toLowerCase(),
      metadata: {
        userId: req.user.id,
        planId,
      },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
        Msg.PAYMENT_INTENT_CREATED
      )
    );
  } catch (error) {
    console.error("Create payment intent error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const stripeWebhookHandle = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    /* ---------------- PAYMENT SUCCESS ---------------- */
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;

      // console.log("Payment successful:", intent);

      const { userId, planId } = intent.metadata;

      if (!userId || !planId) {
        console.log("Missing metadata, skipping webhook processing");
        return res.status(200).send("Webhook received");
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        console.log("Plan not found:", planId);
        return res.status(200).send("Webhook received");
      }

      // Create payment record
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        {
          user: userId,
          plan: planId,
          amount: intent.amount_received / 100,
          currency: intent.currency.toUpperCase(),
          status: "success",
        },
        { upsert: true, new: true }
      );

      // Create user subscription
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + plan.durationDays);

      await UserSubscriptionPlan.findOneAndUpdate(
        { user: userId },
        {
          plan: planId,
          startDate,
          endDate,
          status: "active",
        },
        { upsert: true, new: true }
      );

      console.log("Subscription activated for user:");
    }

    /* ---------------- PAYMENT FAILED ---------------- */
    if (event.type === "payment_intent.payment_failed") {
      // console.log("Payment failed:", event.data.object);
      const intent = event.data.object;

      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        { status: "failed" },
        { upsert: true }
      );
    }

    return res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Stripe webhook DB error:", error);
    return res.status(500).send(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const confirmPaymentIntentHandle = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa",

    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
        Msg.PAYMENT_SUCCESS
      )
    );
  } catch (error) {
    console.error("Error confirming payment:", error);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
};
