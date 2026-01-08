import mongoose from "mongoose";



const LectureNotesSchema = new mongoose.Schema(
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

   
    notesAi: {
      type: Object,
      required: true,
    },

  
    notesUser: {
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




const Notes =mongoose.model("Notes", LectureNotesSchema);
export default Notes;