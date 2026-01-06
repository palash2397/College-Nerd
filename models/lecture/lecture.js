import mongoose from "mongoose";

const LectureSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: false,
    },

    sessionId: {
      type: String,
      required: true,
      index: true,
      unique: true, // 1 lecture per session
    },

    courseType:{
      type: String,
      required: false,
    },

    moduleType:{
      type: String,
      required: false,
    },
    

    sourceType: {
      type: String,
      enum: ["recording", "upload"],
      required: true,
    },

    // Lecture lifecycle status
    status: {
      type: String,
      default: "created",
      index: true,
    },



    language: {
      type: String,
      default: "en",
    },

    // audioUrl: {
    //   type: String,
    //   default: null,
    // },

    // // AI Output References (child collections)
    // notesIds: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "LectureNotes",
    //   },
    // ],

    // summaryIds: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "LectureSummary",
    //   },
    // ],

    // mcqIds: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "LectureMCQ",
    //   },
    // ],

    // flashcardIds: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "LectureFlashcard",
    //   },
    // ],

    // // audit trail
    // generatedByAI: {
    //   type: Boolean,
    //   default: true,
    // },

    // lastActivityAt: {
    //   type: Date,
    //   default: Date.now,
    // },
  },

  { timestamps: true }
);

const Lecture =mongoose.model("Lecture", LectureSchema);
export default Lecture;
