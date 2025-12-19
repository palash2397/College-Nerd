import { Router } from "express";
import { programHandle, deleteProgramHandle } from "../controllers/admin/program.controller.js";
import { auth, isAdmin } from "../middlewares/auth.js";

const adminRouter = Router();
adminRouter.post("/program", auth, isAdmin, programHandle)
adminRouter.delete("/program/:id", auth, isAdmin, deleteProgramHandle)


export default adminRouter;


