import mongoose from "mongoose";

const LectureSummarySchema = new mongoose.Schema(
  {
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
      index: true,
    },

    transcriptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transcription",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Store AI structured summary JSON
    summaryAi: {
      type: Object,
      required: true,
    },

    // Optional user-edited summary
    summaryUser: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["generated", "edited"],
      default: "generated",
    },
  },
  { timestamps: true }
);

const Summary =  mongoose.model("Summary", LectureSummarySchema);
export default Summary;
