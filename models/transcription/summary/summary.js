import mongoose from "mongoose";


const summarySchema = new mongoose.Schema(
  {
   
  },
  { timestamps: true }
);
const Summary = mongoose.model("Summary", summarySchema);
export default Summary;