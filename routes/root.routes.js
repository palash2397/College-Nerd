import { Router } from "express";

import userRouter from "./user.routes.js";
import adminRouter from "./admin.routes.js";
import googleRouter from "./google.route.js";
import lectureRouter from "./lecture.routes.js";

const rootRouter = Router();

rootRouter.use("/user", userRouter)
rootRouter.use("/admin", adminRouter)
rootRouter.use("/auth/google", googleRouter)
rootRouter.use("/lecture", lectureRouter)

export default rootRouter;