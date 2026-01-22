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
  transcriptAudioFileHandle,
  transcriptHandle,
  lecturePdfHandle
} from "../controllers/lecture/lecture.controller.js";
import { auth } from "../middlewares/auth.js";
import { setUploadPath } from "../utils/helpers.js";
import { upload } from "../middlewares/multer.js";
import { checkSubscription } from "../middlewares/subscription.js";

const lectureRouter = Router();

lectureRouter.get("/lectures", auth, checkSubscription, userLecturesHandle);
lectureRouter.get("/notes/:id", auth, checkSubscription, notesbyTranscriptIdHandle);
lectureRouter.get("/summary/:id", auth, checkSubscription, summarybyTranscriptIdHandle);
lectureRouter.get("/all-notes", auth, checkSubscription, allNotesHandle);
lectureRouter.get("/all-summary", auth, checkSubscription, allSummaryHandle);
lectureRouter.post("/generate-mcq/:id", auth, checkSubscription, generateTranscriptMcqHandle);
lectureRouter.post("/generate-card/:id", auth, checkSubscription, generateTranscriptCardsHandle);
lectureRouter.post("/submit-mcq", auth, checkSubscription, submitMcqHandle);
lectureRouter.get("/result-mcq/:id", auth, checkSubscription, resultMcqHandle);
lectureRouter.post("/transcript-audio/:id", auth, checkSubscription, setUploadPath("transcript"), upload.single("file"), transcriptAudioFileHandle);
lectureRouter.get("/transcript/:id", auth, checkSubscription, transcriptHandle);
lectureRouter.get("/lecture-pdf", auth, checkSubscription, lecturePdfHandle);

export default lectureRouter;
