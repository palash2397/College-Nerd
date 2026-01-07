import { Router } from "express";

import {
  userLecturesHandle,
  notesbyTranscriptIdHandle,
  summarybyTranscriptIdHandle,
  allNotesHandle,
  allSummaryHandle,
  generateTranscriptMcqHandle,
  generateTranscriptCardsHandle,
  submitMcqHandle,
  resultMcqHandle,
} from "../controllers/lecture/lecture.controller.js";
import { auth } from "../middlewares/auth.js";

const lectureRouter = Router();

lectureRouter.get("/lectures", auth, userLecturesHandle);
lectureRouter.get("/notes/:id", auth, notesbyTranscriptIdHandle);
lectureRouter.get("/summary/:id", auth, summarybyTranscriptIdHandle);
lectureRouter.get("/all-notes", auth, allNotesHandle);
lectureRouter.get("/all-summary", auth, allSummaryHandle);
lectureRouter.post("/generate-mcq/:id", auth, generateTranscriptMcqHandle);
lectureRouter.post("/generate-card/:id", auth, generateTranscriptCardsHandle);
lectureRouter.post("/submit-mcq", auth, submitMcqHandle);
lectureRouter.get("/result-mcq/:id", auth, resultMcqHandle);

export default lectureRouter;
