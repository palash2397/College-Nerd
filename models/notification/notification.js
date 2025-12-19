import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // one settings record per user
            index: true
        },

        generalNotification: {
            type: Boolean,
            default: true
        },
        sound: {
            type: Boolean,
            default: false
        },
        vibrate: {
            type: Boolean,
            default: false
        },
        appUpdates: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const Notification =  mongoose.model("Notification", NotificationSchema);

export default Notification