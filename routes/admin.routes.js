import { Router } from "express";
import {
  programHandle,
  deleteProgramHandle,
} from "../controllers/admin/program.controller.js";
import {
  addFaqHandle,
  deleteFaqHandle,
  legalMessage,
  getLegalMessage,
  updateLegalMessage,
  allUserHandle,
  userByIdHandle,
  deactivatAccountHandle,
} from "../controllers/admin/admin.controller.js";

import { upload } from "../middlewares/multer.js";
import { setUploadPath } from "../utils/helpers.js";

import {
  dashboardHandle,
  userStatsHandle,
  latestUsersHandle,
  addUserHandle,
  allLecturesHandle,
  searchUserHandle,
} from "../controllers/admin/dashborad.controller.js";

import { createFlashCardHandle } from "../controllers/admin/flashcard.controller.js";

import { auth, isAdmin } from "../middlewares/auth.js";

const adminRouter = Router();
adminRouter.post("/program", auth, isAdmin, programHandle);
adminRouter.delete("/program/:id", auth, isAdmin, deleteProgramHandle);
adminRouter.post("/faq", auth, isAdmin, addFaqHandle);
adminRouter.delete("/faq/:id", auth, isAdmin, deleteFaqHandle);

adminRouter.post("/policy", auth, isAdmin, legalMessage);
adminRouter.patch("/policy", auth, isAdmin, updateLegalMessage);
adminRouter.get("/policy/:type", auth, getLegalMessage);
adminRouter.get("/users/all", auth, isAdmin, allUserHandle);
adminRouter.get("/user/:id", auth, isAdmin, userByIdHandle);
adminRouter.patch(
  "/user/deactivate/:id",
  auth,
  isAdmin,
  deactivatAccountHandle
);

// Dashboard
adminRouter.get("/dashboard", auth, isAdmin, dashboardHandle);
adminRouter.get("/user-stats", auth, isAdmin, userStatsHandle);
adminRouter.get("/latest-users", auth, isAdmin, latestUsersHandle);
adminRouter.post(
  "/add-user",
  auth,
  isAdmin,
  setUploadPath("profile"),
  upload.single("avatar"),
  addUserHandle
);
adminRouter.get("/lectures", auth, isAdmin, allLecturesHandle);
adminRouter.get("/search-user", auth, isAdmin, searchUserHandle);



// Flashcard
adminRouter.post("/flashcard", auth, isAdmin, createFlashCardHandle);

export default adminRouter;
