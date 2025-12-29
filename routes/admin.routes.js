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
} from "../controllers/admin/admin.controller.js";
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
adminRouter.get("/user/:id", auth, isAdmin, userByIdHandle)

export default adminRouter;
