import mongoose from "mongoose";

const FlashcardSchema = new mongoose.Schema(
  {
    // Who created it (admin)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Optional linking
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      default: null,
    },

    topic: {
      type: String,
      default: null,
      trim: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Flashcard = mongoose.model("Flashcard", FlashcardSchema);
export default Flashcard;