import { Router } from "express";
import express from "express";
import {
  registerHandle,
  verifyOtpHandle,
  resendOtpHandle,
  loginHandle,
  forgotPasswordHandle,
  resetPasswordHandle,
  updateProfileHandle,
  myProfileHandle,
  changePasswordHandle,
  allProgramsHandle,
  allNotifications,
  updateNotificationSettings,
  myLanguagesHandle,
  updateLanguageHandle,
  contactUsHandle,
  getFaqHandle,
  saveTranscriptHandle,
  convertToSoapHandle,
  transcribeFileHandle,
  generateAiNotesHandle,
  generateNotesSummaryHandle,
  submitFeedbackHandle,
  userFeedbackHandle,
  saveMedicalScribetHandle,
  allUsersFeedbackHandle,
  allFlashCards,
  flashCardByIdHandle,
} from "../controllers/user/user.controller.js";

import {
  getAllPlansHandle,
  subscribeToPlanHandle,
  getMySubscriptionHandle,
} from "../controllers/admin/subscription.controller.js";

import {
  createSubscriptionPaymentIntentHandle,
  stripeWebhookHandle,
  confirmPaymentIntentHandle,
  paymentHistory,
} from "../controllers/payment/payment.controller.js";

import {
  generateNotesFromFileHandle,
  myNotesHandle,
  myNoteHandle,
  notesToPdfHandle,
} from "../controllers/ai-notes/notes.controller.js";
import { auth } from "../middlewares/auth.js";
import { setUploadPath } from "../utils/helpers.js";
import { upload } from "../middlewares/multer.js";

import { checkSubscription } from "../middlewares/subscription.js";

const userRouter = Router();

userRouter.post("/register", registerHandle);
userRouter.post("/verify-otp", verifyOtpHandle);
userRouter.post("/resend-otp", resendOtpHandle);
userRouter.post("/login", loginHandle);
userRouter.post("/forgot-password", forgotPasswordHandle);
userRouter.post("/reset-password", resetPasswordHandle);
userRouter.post("/change-password", auth, changePasswordHandle);
userRouter.post(
  "/update",
  auth,
  setUploadPath("profile"),
  upload.single("avatar"),
  updateProfileHandle,
);
userRouter.get("/my-profile", auth, myProfileHandle);
userRouter.get("/programs", allProgramsHandle);
userRouter.get("/notifications", auth, allNotifications);
userRouter.patch("/notification-setting", auth, updateNotificationSettings);
userRouter.get("/languages", auth, myLanguagesHandle);
userRouter.patch("/language", auth, updateLanguageHandle);
userRouter.post("/contact", auth, contactUsHandle);
userRouter.get("/faq", auth, getFaqHandle);
userRouter.post("/transcript/save", auth, checkSubscription, saveTranscriptHandle);
userRouter.post("/medical-scribe/save", auth, checkSubscription, saveMedicalScribetHandle);
userRouter.post("/transcript/soap/:id", auth, checkSubscription, convertToSoapHandle);
userRouter.post(
  "/transcribe/file",
  auth,
  checkSubscription,
  setUploadPath("transcribe"),
  upload.single("file"),
  transcribeFileHandle,
);

// feedback
userRouter.post("/feedback", auth, submitFeedbackHandle);
userRouter.get("/feedback", auth, userFeedbackHandle);
userRouter.get("/feedback/all", auth, allUsersFeedbackHandle);

// ai
userRouter.post("/generate/ai-notes/:id", auth, checkSubscription, generateAiNotesHandle);
userRouter.post("/generate/ai-summary/:id", auth, checkSubscription,generateNotesSummaryHandle);

// flashcard
userRouter.get("/flashcard", auth, checkSubscription, allFlashCards);
userRouter.get("/flashcard/:id", auth, checkSubscription,flashCardByIdHandle);

// subscription
userRouter.get("/plans", auth, getAllPlansHandle);
userRouter.post("/subscribe/:planId", auth, subscribeToPlanHandle);
userRouter.get("/my-subscription", auth, getMySubscriptionHandle);

// payment
userRouter.post(
  "/payment-intent/:planId",
  auth,
  createSubscriptionPaymentIntentHandle,
);
// userRouter.post(
//   "/webhook/stripe",
//   express.raw({ type: "application/json" }),
//   stripeWebhookHandle,
// );
userRouter.post(
  "/confirm-payment/:paymentIntentId",
  auth,
  confirmPaymentIntentHandle,
);

// payment
userRouter.get("/payment-history", auth, paymentHistory);

// ai
userRouter.post(
  "/generate/ai/notes/:type",
  auth,
  setUploadPath("notes"),
  upload.single("file"),
  generateNotesFromFileHandle,
);

userRouter.get("/ai/my-notes", auth, checkSubscription, myNotesHandle);
userRouter.get("/ai/my-note/:id", auth, checkSubscription,myNoteHandle);
userRouter.get("/ai/my-note/:id/pdf", auth, checkSubscription,notesToPdfHandle);

export default userRouter;
