import mongoose from "mongoose";

const ContestQuestionSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["mcq"], // extend later (range, percentage)
      default: "mcq",
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      required: true,
    },

    correctIndex: {
      type: Number,
      required: true,
    },

    correctAnswer: {
      type: String,
      required: true,
    },

    explanation: {
      type: String,
      default: null,
    },

    order: {
      type: Number,
      default: 0, // question order in contest
    },
  },
  { timestamps: true }
);

const ContestQuestion = mongoose.model("ContestQuestion", ContestQuestionSchema);
export default ContestQuestion;
