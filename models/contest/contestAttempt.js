import mongoose from "mongoose";

const ContestAttemptSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    finishedAt: {
      type: Date,
      default: null,
    },

    totalQuestions: {
      type: Number,
      default: 0,
    },

    correctCount: {
      type: Number,
      default: 0,
    },

    wrongCount: {
      type: Number,
      default: 0,
    },

    skippedCount: {
      type: Number,
      default: 0,
    },

    scorePercent: {
      type: Number,
      default: 0,
    },

    timeTakenSeconds: {
      type: Number,
      default: 0,
    },

    rewardCoins: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["started", "submitted", "evaluated"],
      default: "started",
    },
  },
  { timestamps: true }
);

// One attempt per user per contest
ContestAttemptSchema.index({ contestId: 1, userId: 1 }, { unique: true });

const ContestAttempt = mongoose.model("ContestAttempt", ContestAttemptSchema);
export default ContestAttempt;
