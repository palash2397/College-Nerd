import mongoose from "mongoose";

const transcriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sessionId: {
      type: String,
      default: null,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["approved", "draft", "deleted"],
      default: "approved",
    },
  },
  { timestamps: true }
);
const Transcription = mongoose.model("Transcription", transcriptionSchema);
export default Transcription;
