import { Router } from "express";

import { userLecturesHandle } from "../controllers/lecture/lecture.controller.js";
import { auth } from "../middlewares/auth.js";


const lectureRouter = Router();

lectureRouter.get("/lectures", auth, userLecturesHandle);

export default lectureRouter