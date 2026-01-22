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
import { checkSubscription } from "../middlewares/subscription.js";

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
contestRouter.post("/:contestId/start", auth, checkSubscription,startContestHandle);
contestRouter.get("/:attemptId/questions", auth, checkSubscription,contestQuestionsHandle);
contestRouter.post("/submit", auth, checkSubscription,submitContestHandle);
contestRouter.get("/:contestId/leaderboard", auth, checkSubscription,contestLeaderboardHandle);
contestRouter.get("/leaderboard/global", auth, checkSubscription,globalLeaderboardHandle);
contestRouter.get("/leaderboard/global/today", auth, checkSubscription,globalLeaderboardTodayHandle);
contestRouter.get("/leaderboard/global/monthly", auth, checkSubscription, globalLeaderboardMonthlyHandle);

export default contestRouter;
