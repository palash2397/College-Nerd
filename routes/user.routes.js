import { Router } from "express";
import {
  registerHandle,
  verifyOtpHandle,
  resendOtpHandle,
  loginHandle,
  forgotPasswordHandle,
  resetPasswordHandle,
  updateProfileHandle,
  myProfileHandle,
  changePasswordHandle,
  allProgramsHandle,
  allNotifications,
  updateNotificationSettings,
  myLanguagesHandle,
  updateLanguageHandle,
  
} from "../controllers/user/user.controller.js";
import { auth } from "../middlewares/auth.js";
import { setUploadPath } from "../utils/helpers.js";
import { upload } from "../middlewares/multer.js";

const userRouter = Router();

userRouter.post("/register", registerHandle);
userRouter.post("/verify-otp", verifyOtpHandle);
userRouter.post("/resend-otp", resendOtpHandle);
userRouter.post("/login", loginHandle);
userRouter.post("/forgot-password", forgotPasswordHandle);
userRouter.post("/reset-password", resetPasswordHandle);
userRouter.post("/change-password", auth, changePasswordHandle);
userRouter.post(
  "/update",
  auth,
  setUploadPath("profile"),
  upload.single("avatar"),
  updateProfileHandle,
);
userRouter.get("/profile", auth, myProfileHandle);
userRouter.get("/programs", allProgramsHandle);
userRouter.get("/notifications", auth, allNotifications);
userRouter.patch("/notification-setting", auth, updateNotificationSettings)
userRouter.get("/languages", auth, myLanguagesHandle)
userRouter.patch("/language", auth, updateLanguageHandle)


export default userRouter;
