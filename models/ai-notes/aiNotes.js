import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    noteType: {
      type: String,
      enum: ["structured", "detailed", "short", "custom"],
      default: "detailed",
      index: true,
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    markdown: {
      type: String,
      default: "",
    },

    html: {
      type: String,
      required: true, // ✅ PDF will use this
    },

    source: {
      fileName: { type: String, default: "" },
      mimeType: { type: String, default: "" },
      size: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["generated", "failed"],
      default: "generated",
    },
  },
  { timestamps: true }
);

// NoteSchema.index({ userId: 1, createdAt: -1 });

const AiNotes = mongoose.model("AiNotes", NoteSchema);
export default AiNotes;
