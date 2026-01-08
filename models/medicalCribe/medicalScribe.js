import mongoose from "mongoose";

const medicalScribeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
const MedicalScribe = mongoose.model("MedicalScribe", medicalScribeSchema);
export default MedicalScribe;
