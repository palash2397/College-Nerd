import { ApiResponse } from "../utils/ApiResponse.js";
import {Msg} from "../utils/responseMsg.js"
import User from "../models/user/user.js";
import Jwt from "jsonwebtoken"
import Joi from "joi";
import { generateOtp, getExpirationTime } from "../utils/helpers.js";
import { sendOtpMail } from "../utils/email.js";


export const registerHandle = async (req, res) => {
    try {
        const { name, email, phoneNumber, password, program } = req.body;
        const schema = Joi.object({
            name: Joi.string().required(),
            email: Joi.string().required(),
            phoneNumber: Joi.string().required(),
            password: Joi.string().min(6).required(),
            program: Joi.string().required(),

        });

        const { error } = schema.validate(req.body);

        if (error)
            return res
                .status(400)
                .json(new ApiResponse(400, {}, error.details[0].message));

        const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
        if (existingUser) {
            if (existingUser.isVerified == false) {
                const otp = generateOtp();
                existingUser.otp = otp;
                await existingUser.save();
                await sendOtpMail( existingUser.email, otp);

                console.log(`Resend OTP ${otp}`);
                return res
                    .status(201)
                    .json(
                        new ApiResponse(200, { userId: existingUser._id }, Msg.OTP_RESENT)
                    );
            }

            return res.status(401).json(new ApiResponse(400, {}, Msg.USER_EXISTS));
        }

        const otp = generateOtp();
        const otpExpireAt = getExpirationTime();

        await sendOtpMail(otp, email);

        const user = new User({
            name,
            email: email ? email.toLowerCase() : email,
            phoneNumber,
            password,
            program,
            otp,
            otpExpireAt,
        });

        await user.save();

        return res.status(201).json(new ApiResponse(200, {}, Msg.OTP_SENT));
    } catch (error) {
        console.error(`Error while registering user:`, error);
        return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
    }
};


export const verifyOtpHandle = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    const schema = Joi.object({
      email: Joi.string().email().required(),
      otp: Joi.string().length(4).required(),
      purpose: Joi.string().valid("password", "verify").optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, Msg.USER_NOT_FOUND));
    }

    if (!user.otp || !user.otpExpireAt) {
      return res.status(400).json(new ApiResponse(400, {}, Msg.OTP_NOT_FOUND));
    }

    if (user.otp !== otp || new Date() > user.otpExpireAt) {
      return res.status(400).json(new ApiResponse(400, {}, Msg.OTP_INVALID));
    }

    // Forgot Password Flow
    if (purpose === "password") {
      user.otp = null;
      user.otpExpireAt = null;
      user.otpVerifiedForResetPassword = true;
      await user.save();

      return res.status(200).json(new ApiResponse(200, {}, Msg.OTP_VERIFIED));
    }

    // Account Verification Flow
    if (user.isVerified) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.USER_ALREADY_VERIFIED));
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpireAt = null;
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, `User account verified successfully.`));
  } catch (error) {
    console.error(`Error while verifying OTP:`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const resendOtpHandle = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    const schema = Joi.object({
      email: Joi.string().email().required(),
      purpose: Joi.string().valid("password", "verify").optional(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(400).json(new ApiResponse(400, {}, Msg.USER_NOT_FOUND));

    if (purpose === "password") {
      const otp = await generateOtp();
      const otpExpireAt = getExpirationTime();
      user.otp = otp;
      user.otpExpireAt = otpExpireAt;
      await user.save();
      await sendOtpforgotPasswordMail(otp, user.email);

      console.log(` resend OTP ---------> ${otp} `);

      return res.status(200).json(new ApiResponse(200, {}, Msg.OTP_RESENT));
    }

    if (user.isVerified)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.USER_ALREADY_VERIFIED));

    const otp = await generateOtp();
    const otpExpireAt = getExpirationTime();
    user.otp = otp;
    user.otpExpireAt = otpExpireAt;
    await user.save();
    await sendOtpMail(otp, user.email);

    return res.status(200).json(new ApiResponse(200, {}, Msg.OTP_RESENT));
  } catch (error) {
    console.error(`Error while resending OTP:`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const loginHandle = async (req, res) => {
  try {
    const { email, password } = req.body;
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user)
      return res.status(400).json(new ApiResponse(400, {}, Msg.USER_NOT_FOUND));

    if (!user.isVerified)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.USER_NOT_VERIFIED));

    if (!user.isActive)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.ACCOUNT_DEACTIVATED));

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    console.log("ispasswordcorrect --->", isPasswordCorrect)
    if (!isPasswordCorrect)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.INVALID_CREDENTIALS));
    const token = Jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const userData = {
      userId: user._id,

      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      token: token,
    };

    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "strict",
    //   maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    // });

    return res
      .status(200)
      .json(new ApiResponse(200, userData, Msg.LOGIN_SUCCESS));
  } catch (error) {
    console.log(`Error while logging in user:`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

