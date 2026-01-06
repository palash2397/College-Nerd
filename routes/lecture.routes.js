import { Router } from "express";

import {
  userLecturesHandle,
  notesbyTranscriptIdHandle,
  summarybyTranscriptIdHandle,
  allNotesHandle,
  allSummaryHandle,
} from "../controllers/lecture/lecture.controller.js";
import { auth } from "../middlewares/auth.js";

const lectureRouter = Router();

lectureRouter.get("/lectures", auth, userLecturesHandle);
lectureRouter.get("/notes/:id", auth, notesbyTranscriptIdHandle);
lectureRouter.get("/summary/:id", auth, summarybyTranscriptIdHandle);
lectureRouter.get("/all-notes", auth, allNotesHandle);
lectureRouter.get("/all-summary", auth, allSummaryHandle);

export default lectureRouter;
