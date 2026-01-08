import Jwt from "jsonwebtoken";
import Joi from "joi";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

import User from "../../models/user/user.js";
import Program from "../../models/program/program.js";
import Notification from "../../models/notification/notification.js";
import Language from "../../models/language/language.js";
import Faq from "../../models/faq/faq.js";
import Transcription from "../../models/transcription/transcription.js";
import Lecture from "../../models/lecture/lecture.js";
import Notes from "../../models/lecture/notes/notes.js";
import Summary from "../../models/lecture/summary/summary.js";
import Feedback from "../../models/feedback/feedback.js";
import MedicalScribe from "../../models/medicalCribe/medicalScribe.js";

import { allowedLanguages } from "../../utils/helpers.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import {
  generateOtp,
  getExpirationTime,
  deleteOldImages,
  allowedFields,
  formatDate
} from "../../utils/helpers.js";
import {
  sendOtpMail,
  sendOtpforgotPasswordMail,
  sendContactUsMail,
} from "../../utils/email.js";

export const registerHandle = async (req, res) => {
  try {
    const { name, email, countryCode, phoneNumber, password, program } =
      req.body;
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().required(),
      phoneNumber: Joi.string().required(),
      countryCode: Joi.string().required(),
      password: Joi.string().min(8).required().messages({
        "string.min": "Password must be at least 8 characters long",
        "string.empty": "Password is required",
        "any.required": "Password is required",
      }),
      program: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);

    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phoneNumber: phoneNumber, countryCode: countryCode },
      ],
    });

    if (existingUser) {
      let errorField = "User with the same ";
      if (existingUser.email === email.toLowerCase()) {
        errorField += "email already exists";
      } else if (existingUser.phoneNumber === phoneNumber) {
        errorField += "phone number already exists";
      } else {
        errorField = "User already exists";
      }
      return res.status(400).json(new ApiResponse(400, {}, errorField));
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
      countryCode,
      otp,
      otpExpireAt,
    });

    await user.save();

    await Notification.create({
      user: user._id,
    });

    await Language.create({
      user: user._id,
    });

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

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
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
    console.log("ispasswordcorrect --->", isPasswordCorrect);
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

export const forgotPasswordHandle = async (req, res) => {
  try {
    const { email } = req.body;
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));

    if (!user.isVerified)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.USER_NOT_VERIFIED));

    if (!user.isActive)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.ACCOUNT_DEACTIVATED));

    const otp = generateOtp();
    const otpExpireAt = getExpirationTime();
    user.otp = otp;
    user.otpExpireAt = otpExpireAt;
    await user.save();
    await sendOtpforgotPasswordMail(user.otp, user.email);
    console.log(` OTP ---------> ${otp} `);
    return res.status(201).json(new ApiResponse(200, {}, Msg.OTP_SENT));
  } catch (error) {
    console.log(`Error while forgot password :`, error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, `Internal Server Error`));
  }
};

export const resetPasswordHandle = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      confirmPassword: Joi.string()
        .min(8)
        .required()
        .valid(Joi.ref("password"))
        .messages({
          "any.only": "Confirm password must match password",
        }),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));

    if (!user.otpVerifiedForResetPassword)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.OTP_NOT_VERIFIED));

    if (!user.isVerified)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.USER_NOT_VERIFIED));

    if (!user.isActive)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.ACCOUNT_DEACTIVATED));

    const oldPassword = await user.isPasswordCorrect(password);
    if (oldPassword)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.ENTERED_OLD_PASSWORD));

    user.password = password;
    user.otp = null;
    user.otpExpireAt = null;
    user.otpVerifiedForResetPassword = false;
    await user.save();
    return res.status(200).json(new ApiResponse(200, {}, Msg.PASSWORD_CHANGED));
  } catch (error) {
    console.log(`Error while changing password :`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const changePasswordHandle = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const schema = Joi.object({
      password: Joi.string()
        .min(8)
        .message({
          "string.min": "Password must be at least 8 characters long",
          "string.empty": "Password is required",
          "any.required": "Password is required",
        })
        .required(),
      confirmPassword: Joi.string()
        .min(8)
        .required()
        .valid(Joi.ref("password"))
        .messages({
          "string.min": "Password must be at least 8 characters long",
          "string.empty": "Password is required",
          "any.required": "Password is required",
          "any.only": "Confirm password must match password",
        })
        .required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const user = await User.findOne({ _id: req.user.id });
    if (!user)
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));

    if (!user.isActive)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.ACCOUNT_DEACTIVATED));

    const oldPassword = await user.isPasswordCorrect(password);
    if (oldPassword)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.ENTERED_OLD_PASSWORD));

    user.password = password;
    await user.save();
    return res.status(200).json(new ApiResponse(200, {}, Msg.PASSWORD_CHANGED));
  } catch (error) {
    console.log(`Error while changing password :`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const myProfileHandle = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id }).select(
      "-password -otp -otpExpireAt -__v -createdAt -updatedAt -pin -otpVerifiedForResetPassword -googleId"
    );

    if (!user)
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));

    if (!user.isActive)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.ACCOUNT_DEACTIVATED));

    const lectureCount = await Lecture.countDocuments({ user: req.user.id });
    user.avatar = user.avatar
      ? `${process.env.BASE_URL}/profile/${user.avatar}`
      : `${process.env.DEFAULT_PROFILE_PIC}`;

    const userObj = user.toObject();
    userObj.lectureCount = lectureCount;

    return res
      .status(200)
      .json(new ApiResponse(200, userObj, Msg.DATA_FETCHED));
  } catch (error) {
    console.log(`Error while fetching profile :`, error);
    return res.status(501).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const updateProfileHandle = async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;
    const schema = Joi.object({
      name: Joi.string().min(3).max(30).optional(),
      phoneNumber: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const user = await User.findOne({ _id: req.user.id });
    if (!user)
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));

    console.log(`req.file ---------->`, req.file);

    // Handle avatar update if file is provided
    if (req.file) {
      deleteOldImages("profile", user.avatar);
      user.avatar = req.file.filename;
    }

    name ? (user.name = name) : (user.name = user.name);
    phoneNumber
      ? (user.phoneNumber = phoneNumber)
      : (user.phoneNumber = user.phoneNumber);

    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, Msg.DATA_UPDATED));
  } catch (error) {
    console.log(`Error while updating profile :`, error);
    return res.status(501).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const allProgramsHandle = async (req, res) => {
  try {
    const programs = await Program.find({})
      .sort({ createdAt: -1 })
      .select("-__v -updatedAt")
      .lean();

    return res
      .status(200)
      .json(new ApiResponse(200, programs, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error getting all programs:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const allNotifications = async (req, res) => {
  try {
    let notification = await Notification.findOne({ user: req.user.id }).select(
      "-createdAt -updatedAt -__v"
    );

    if (!notification) {
      notification = await Notification.create({
        user: req.user.id,
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, notification, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error getting notifications:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const updateData = {};

    for (const field of allowedFields) {
      if (typeof req.body[field] === "boolean") {
        updateData[field] = req.body[field];
      }
    }
    const notification = await Notification.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).select("-createdAt -updatedAt -__v");

    return res
      .status(200)
      .json(new ApiResponse(200, notification, Msg.DATA_UPDATED));
  } catch (error) {
    console.error("Error getting notifications:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const myLanguagesHandle = async (req, res) => {
  try {
    const languages = await Language.find({ userId: req.user.id }).select(
      "-createdAt -updatedAt -__v"
    );

    if (languages.length == 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, languages, Msg.DATA_NOT_FOUND));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, languages, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error while getting languages:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const updateLanguageHandle = async (req, res) => {
  try {
    const { languageCode } = req.body;

    if (!allowedLanguages.includes(languageCode)) {
      return res.status(400).json(new ApiResponse(400, {}, Msg.DATA_NOT_FOUND));
    }

    const language = await Language.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { languageCode } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).select("-__v -updatedAt -createdAt");

    return res
      .status(200)
      .json(new ApiResponse(200, language, Msg.DATA_UPDATED));
  } catch (error) {
    console.error("Error while updating language:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const contactUsHandle = async (req, res) => {
  try {
    const { msg } = req.body;

    const schema = Joi.object({
      msg: Joi.string().min(10).max(2000).required().messages({
        "string.empty": "Message is required",
        "string.min": "Message must be at least 10 characters long",
        "string.max": "Message cannot be longer than 2000 characters",
        "any.required": "Message is required",
      }),
    });

    const { error } = schema.validate(req.body);

    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const user = await User.findOne({ _id: req.user.id });
    if (!user) {
      return res.status(400).json(new ApiResponse(400, {}, Msg.USER_NOT_FOUND));
    }

    await sendContactUsMail(user.name, msg, user.email);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "Thank you for contacting us. We will get back to you soon!"
        )
      );
  } catch (error) {
    console.error("Error while processing contact form:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getFaqHandle = async (req, res) => {
  try {
    const data = await Faq.find().select("-__v -createdAt -updatedAt");

    return res.status(201).json(new ApiResponse(200, data, Msg.DATA_ADDED));
  } catch (error) {
    console.log(`error while getting faq ${error}`);
    res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const saveTranscriptHandle = async (req, res) => {
  try {
    const { text, sessionId, courseType, moduleType, title } = req.body;
    const schema = Joi.object({
      text: Joi.string().trim().required(),
      sessionId: Joi.string().required(),
      courseType: Joi.string().optional(),
      moduleType: Joi.string().optional(),
      title: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    let lecture = await Lecture.findOne({ sessionId });
    if (lecture) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.DATA_ALREADY_EXISTS));
    }

    lecture = await Lecture.create({
      user: req.user.id,
      courseType: courseType || null,
      moduleType: moduleType || null,
      title: title || null,
      sessionId,
      sourceType: "recording",
    });

    const transcription = await Transcription.create({
      user: req.user.id,
      text,
      status: "approved",
      sessionId,
      lectureId: lecture._id,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, transcription, Msg.DATA_ADDED));
  } catch (error) {
    console.log("Error saving transcription", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const saveMedicalScribetHandle = async (req, res) => {
  try {
    const { text } = req.body;
    const schema = Joi.object({
      text: Joi.string().trim().required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

   

    const transcription = await MedicalScribe.create({
      user: req.user.id,
      text,
      status: "approved",
 
    });

    return res
      .status(200)
      .json(new ApiResponse(200, transcription, Msg.DATA_ADDED));
  } catch (error) {
    console.log("Error saving transcription", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const convertToSoapHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate({ id });
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const data = await MedicalScribe.findById(id).select(
      "-createdAt -updatedAt -__v"
    );
    console.log("data ----------->", data);

    if (!data)
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));

    const response = await axios.post(
      "https://python.aitechnotech.in/soap-notes/convert-to-soap",
      {
        transcription: data.text,
      }
    );

    const soapNotes = response.data;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transcription: data,
          soapNotes,
        },
        Msg.DATA_GENERATED
      )
    );
  } catch (error) {
    console.log("Error while converting to soap", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const transcribeFileHandle = async (req, res) => {
  try {
    const body = req.body || {};

    const courseType = body.courseType || "";
    const moduleType = body.moduleType || "";
    const title = body.title || "";

    const schema = Joi.object({
      courseType: Joi.string().optional().allow(""),
      moduleType: Joi.string().optional().allow(""),
      title: Joi.string().optional().allow(""),
    });
    const { error } = schema.validate({ courseType, moduleType, title });
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    if (!req.file) {
      return res.status(400).json(new ApiResponse(400, {}, Msg.DATA_REQUIRED));
    }

    console.log("-------->", req.user);
    const filePath = req.file.path;
    const formData = new FormData();
    formData.append(
      "file",
      fs.createReadStream(filePath),
      req.file.originalname
    );

    const response = await axios.post(
      "https://python.aitechnotech.in/transcribe/transcribe-file",
      formData,
      { headers: formData.getHeaders() }
    );

    const transcription = response.data;

    const lecture = await Lecture.create({
      user: req.user.id,
      sessionId: transcription.session_id,
      courseType: courseType || null,
      moduleType: moduleType || null,
      title: title || null,
      sourceType: "recording",
    });

    const transcriptionData = await Transcription.create({
      user: req.user.id,
      sessionId: transcription.session_id,
      lectureId: lecture._id,
      text: transcription.transcript,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { transcriptionId: transcriptionData._id, transcription },
          Msg.DATA_GENERATED
        )
      );
  } catch (error) {
    console.log("Error while transcribing file", error);

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const generateAiNotesHandle = async (req, res) => {
  try {
    const { id } = req.params; // transcriptionId

    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate({ id });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    // 1️⃣ Fetch transcription
    const transcription = await Transcription.findById(id);

    if (!transcription) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    // 2️⃣ Ensure lecture exists
    const lecture = await Lecture.findById(transcription.lectureId);

    if (!lecture) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    let existingNotes = await Notes.findOne({
      lectureId: lecture._id,
      transcriptId: transcription._id,
      user: transcription.user,
    });

    if (existingNotes) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            transcription,
            notes: existingNotes,
          },
          Msg.DATA_ALREADY_EXISTS
        )
      );
    }

    const response = await axios.post(
      "https://python.aitechnotech.in/ai-notes/generate-structured-notes",
      {
        transcription: transcription.text,
      }
    );

    const aiNotes = response.data;

    if (!aiNotes) {
      return res.status(500).json(new ApiResponse(500, {}, Msg.DATA_NOT_FOUND));
    }

    const notes = await Notes.create({
      lectureId: lecture._id,
      transcriptId: transcription._id,
      user: transcription.user,

      notesAi: aiNotes,
      notesUser: null,

      status: "generated",
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transcription,
          notes,
        },
        Msg.DATA_GENERATED
      )
    );
  } catch (error) {
    console.log("Error while generating medical transcription file", error);

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const generateNotesSummaryHandle = async (req, res) => {
  try {
    const { id } = req.params;

    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate({ id });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const transcription = await Transcription.findById(id);

    if (!transcription) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    // 2️⃣ Ensure lecture exists
    const lecture = await Lecture.findById(transcription.lectureId);

    if (!lecture) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    let existingSummary = await Summary.findOne({
      lectureId: lecture._id,
      transcriptId: transcription._id,
      user: transcription.user,
    });

    if (existingSummary) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            transcription,
            summary: existingSummary,
          },
          Msg.DATA_ALREADY_EXISTS
        )
      );
    }

    // 4️⃣ Call AI API
    const response = await axios.post(
      "https://python.aitechnotech.in/ai-summarys/generate-ai-notes",
      {
        transcription: transcription.text,
      }
    );

    console.log("response ------>", response);

    const summaryData = response.data?.summary || response.data;

    if (!summaryData) {
      return res.status(500).json(new ApiResponse(500, {}, Msg.DATA_NOT_FOUND));
    }

    const summary = await Summary.create({
      lectureId: lecture._id,
      transcriptId: transcription._id,
      user: transcription.user,

      summaryAi: summaryData,
      summaryUser: null,

      status: "generated",
    });

    await lecture.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transcription,
          summary,
        },
        Msg.DATA_GENERATED
      )
    );
  } catch (error) {
    console.log("Error while generating medical transcription file", error);

    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const submitFeedbackHandle = async (req, res) => {
  try {
    const { rating, review, source } = req.body;

    const schema = Joi.object({
      rating: Joi.number().min(1).max(5).required(),
      review: Joi.string().allow(null, "").optional(),
      source: Joi.string().valid("app", "web").optional(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const feedback = await Feedback.create({
      user: req.user.id,
      rating,
      review: review || null,
      source: source || "app",
    });

    return res.status(200).json(new ApiResponse(200, feedback, Msg.DATA_ADDED));
  } catch (err) {
    console.log("Feedback submit error", err);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const userFeedbackHandle = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user.id })
      .sort({ createdAt: -1 }).select("-updatedAt -__v")


    feedbacks.forEach((feedback) => {
      feedback.createdAt = formatDate(feedback.createdAt);
    });

    return res
      .status(200)
      .json(new ApiResponse(200, feedbacks, Msg.DATA_FETCHED));
  } catch (err) {
    console.log("Fetch feedback error", err);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

