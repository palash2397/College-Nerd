import mongoose from "mongoose";

const LanguageSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        languageCode: {
            type: String,
            enum: ["en", "fr", "es"],
            default: "en",
            required: true
        }
    },
    { timestamps: true }
);

LanguageSchema.index({ user: 1 }, { unique: true });
const Language = mongoose.model("Language", LanguageSchema);
export default Language