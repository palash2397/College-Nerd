import { Router } from "express";
import { registerHandle, verifyOtpHandle, resendOtpHandle, loginHandle, forgotPasswordHandle, resetPasswordHandle, updateProfileHandle } from "../controllers/user.controller.js";
import { auth } from "../middlewares/auth.js";
import { setUploadPath } from "../utils/helpers.js";
import { upload } from "../middlewares/multer.js";

const userRouter = Router();

userRouter.post("/register", registerHandle)
userRouter.post("/verify-otp", verifyOtpHandle);
userRouter.post("/resend-otp", resendOtpHandle);
userRouter.post("/login", loginHandle);
userRouter.post("/forgot-password", forgotPasswordHandle)
userRouter.post("/reset-password", resetPasswordHandle)
userRouter.post("/update", auth, setUploadPath("profile"), upload.single("avatar"), updateProfileHandle)



export default userRouter;