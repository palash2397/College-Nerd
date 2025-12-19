import { Router } from "express";
import { registerHandle, verifyOtpHandle, resendOtpHandle, loginHandle } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.post("/register", registerHandle)
userRouter.post("/verify-otp", verifyOtpHandle);
userRouter.post("/resend-otp", resendOtpHandle);
userRouter.post("/login", loginHandle);



export default userRouter;