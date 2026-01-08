import mongoose from "mongoose";

const TranscriptionSchema = new mongoose.Schema(
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

    text: {
      type: String,
      required: true,
    },

    timedTranscript: {
      status: {
        type: Boolean,
        default: true,
      },

      totalSegments: {
        type: Number,
        default: 0,
      },

      duration: {
        type: String, // "00:54"
        default: null,
      },

      segments: [
        {
          time: String, // "00:10"
          speaker: String, // "Speaker 0"
          text: String,
        },
      ],
    },

    status: {
      type: String,
      enum: ["draft", "approved", "deleted"],
      default: "approved",
    },
  },
  { timestamps: true }
);

const Transcript = mongoose.model("Transcript", TranscriptionSchema);

export default Transcript;
