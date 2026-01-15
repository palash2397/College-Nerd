import mongoose from "mongoose";

const ContestAnswerSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContestAttempt",
      required: true,
      index: true,
    },

    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContestQuestion",
      required: true, 
    },

    answer: {
      type: mongoose.Schema.Types.Mixed, 
     
    },

    isCorrect: {
      type: Boolean,
      default: null, 
    },
  },
  { timestamps: true }
);

const ContestAnswer = mongoose.model("ContestAnswer", ContestAnswerSchema);
export default ContestAnswer;
