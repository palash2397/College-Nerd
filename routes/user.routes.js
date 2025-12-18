import { Router } from "express";
import { registerHandle } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.post("/register", registerHandle)



export default userRouter;