import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    review: {
      type: String,
      trim: true,
      default: null,
    },

    // To detect repeat submissions
    source: {
      type: String,
      enum: ["app", "web"],
      default: "app",
    },

    status: {
      type: String,
      enum: ["submitted", "resolved"],
      default: "submitted",
    },
  },
  { timestamps: true }
);
const Feedback = mongoose.model("Feedback", FeedbackSchema);
export default Feedback;
