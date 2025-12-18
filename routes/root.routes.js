import { Router } from "express";

import userRouter from "./user.routes.js";

const rootRouter = Router();

rootRouter.use("/user", userRouter)


export default rootRouter;