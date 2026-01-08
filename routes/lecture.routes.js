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
  transcriptAudioFileHandle
} from "../controllers/lecture/lecture.controller.js";
import { auth } from "../middlewares/auth.js";
import { setUploadPath } from "../utils/helpers.js";
import { upload } from "../middlewares/multer.js";

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
lectureRouter.post("/transcript-audio", auth, setUploadPath("transcript"), upload.single("file"), transcriptAudioFileHandle);

export default lectureRouter;
