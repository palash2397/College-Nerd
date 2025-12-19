import { Router } from "express";
import { programHandle } from "../controllers/admin/program.controller.js";
import { auth, isAdmin } from "../middlewares/auth.js";

const adminRouter = Router();
adminRouter.post("/program", auth, isAdmin, programHandle)


export default adminRouter;


