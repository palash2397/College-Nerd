import { Router } from "express";
import {
  createContestHandle,
  generateContestQuestionsHandle,
  publishContestHandle,
  getContestListHandle,
  startContestHandle,
  contestQuestionsHandle,
  submitContestHandle,
  contestLeaderboardHandle,
  globalLeaderboardHandle,
  globalLeaderboardTodayHandle,
  globalLeaderboardMonthlyHandle
} from "../controllers/contest/contest.controller.js";
import { auth } from "../middlewares/auth.js";
import { setUploadPath } from "../utils/helpers.js";
import { upload } from "../middlewares/multer.js";
import { isAdmin } from "../middlewares/auth.js";

const contestRouter = Router();

contestRouter.post(
  "/create",
  auth,
  isAdmin,
  setUploadPath("contest/thumbnail"),
  upload.single("thumbnail"),
  createContestHandle
);

contestRouter.post(
  "/:contestId/generate-questions",
  auth,
  isAdmin,
  setUploadPath("contest/pdf"),
  upload.single("pdf"),
  generateContestQuestionsHandle
);

contestRouter.post("/:contestId/publish", auth, isAdmin, publishContestHandle);
contestRouter.get("/list", auth, getContestListHandle);
contestRouter.post("/:contestId/start", auth, startContestHandle);
contestRouter.get("/:attemptId/questions", auth, contestQuestionsHandle);
contestRouter.post("/submit", auth, submitContestHandle);
contestRouter.get("/:contestId/leaderboard", auth, contestLeaderboardHandle);
contestRouter.get("/leaderboard/global", auth, globalLeaderboardHandle);
contestRouter.get("/leaderboard/global/today", auth, globalLeaderboardTodayHandle);
contestRouter.get("/leaderboard/global/monthly", auth, globalLeaderboardMonthlyHandle);

export default contestRouter;
