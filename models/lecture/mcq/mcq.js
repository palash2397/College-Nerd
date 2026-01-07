import mongoose from "mongoose";

const McqAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    transcriptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transcription",
      required: true,
    },

    questions: [
      {
        question: String,
        options: [String],

        correctAnswer: String,
        userAnswer: String,
        isCorrect: {
          type: Boolean,
          default: null,
        },
      },
    ],

    // Attempt lifecycle
    status: {
      type: String,
      enum: ["submitted", "evaluated"],
      default: "submitted",
    },

    totalQuestions: Number,
    correctCount: Number,
    wrongCount: Number,
    scorePercent: Number,
  },
  { timestamps: true }
);

const McqAttempt = mongoose.model("McqAttempt", McqAttemptSchema);
export default McqAttempt;
