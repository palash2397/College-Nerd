import { Router } from "express";

import userRouter from "./user.routes.js";

const rootRouter = Router();

userRouter.use("/user", userRouter)


export default rootRouter;