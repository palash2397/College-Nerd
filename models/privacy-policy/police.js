import mongoose from "mongoose";

const LegalMessageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["privacy_policy", "terms_conditions"],
      required: true,
      unique: true
    },

    message: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const LegalMessage = mongoose.model("LegalMessage", LegalMessageSchema);
export default LegalMessage;
