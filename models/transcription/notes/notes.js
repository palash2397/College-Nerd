import mongoose from "mongoose";


const notesSchema = new mongoose.Schema(
  {
   
  },
  { timestamps: true }
);
const Notes = mongoose.model("Notes", notesSchema);
export default Notes;