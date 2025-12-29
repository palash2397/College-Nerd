import Faq from "../../models/faq/faq.js";
import User from "../../models/user/user.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import LegalMessage from "../../models/privacy-policy/police.js";
import Joi from "joi";

export const addFaqHandle = async (req, res) => {
  try {
    const { que, ans } = req.body;
    const schema = Joi.object({
      que: Joi.string().required(),
      ans: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);

    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const data = await Faq.create({
      question: que,
      answer: ans,
    });

    return res.status(201).json(new ApiResponse(200, data._id, Msg.DATA_ADDED));
  } catch (error) {
    console.log(`error while adding faq ${error}`);
    res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const deleteFaqHandle = async (req, res) => {
  try {
    const { id } = req.params;

    const schema = Joi.string().required();
    const { error } = schema.validate(id);

    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "FAQ ID is required"));
    }

    // Delete the FAQ
    const deletedFaq = await Faq.findByIdAndDelete(id);

    if (!deletedFaq) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_REQUIRED));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { id: deletedFaq._id }, Msg.DATA_DELETED));
  } catch (error) {
    console.error("Error while deleting FAQ:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const legalMessage = async (req, res) => {
  try {
    const { type, message } = req.body;

    const schema = Joi.object({
      type: Joi.string()
        .valid("privacy_policy", "terms_conditions")
        .required()
        .messages({
          "any.required": "Type is required",
        }),

      message: Joi.string().min(1).required().messages({
        "string.empty": "Message cannot be empty",
        "any.required": "Message is required",
      }),
    });

    const { error } = schema.validate(req.body);

    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const exists = await LegalMessage.findOne({ type });
    if (exists) {
      return res
        .status(409)
        .json(new ApiResponse(409, {}, Msg.DATA_ALREADY_EXISTS));
    }

    const legalMessage = await LegalMessage.create({ type, message });

    return res
      .status(200)
      .json(new ApiResponse(200, { id: legalMessage._id }, Msg.DATA_CREATED));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getLegalMessage = async (req, res) => {
  try {
    const { type } = req.params;

    const legalMessage = await LegalMessage.findOne({ type });

    if (!legalMessage) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { message: legalMessage.message },
          Msg.DATA_FETCHED
        )
      );
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const updateLegalMessage = async (req, res) => {
  try {
    const { type, message } = req.body;

    if (!message) {
      return res.status(400).json(new ApiResponse(400, {}, Msg.INVALID_DATA));
    }

    const updated = await LegalMessage.findOneAndUpdate(
      { type },
      { $set: { message } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { id: updated._id }, Msg.DATA_UPDATED));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const allUserHandle = async (req, res) => {
  try {
    const users = await User.find({
      role: { $ne: "admin" },
    }).select(
      "-otp -otpExpireAt -otpVerifiedForResetPassword -createdAt -updatedAt -__v -googleId"
    );

    users.map((item) => {
      item.avatar = item.avatar
        ? `${process.env.BASE_URL}/profile/${item.avatar}`
        : `${process.env.DEFAULT_PROFILE_PIC}`;
    });

    return res.status(200).json(new ApiResponse(200, users, Msg.DATA_FETCHED));
  } catch (error) {
    console.log(`error while getting all users`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const userByIdHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      id: Joi.string().required(),
    });

    const { error } = schema.validate(req.params);

    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const user = await User.findOne({ _id: id }).select(
      "-password -otp -otpExpireAt -__v -createdAt -updatedAt -pin -otpVerifiedForResetPassword -googleId"
    );
    if (!user)
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));

    user.avatar = user.avatar
      ? `${process.env.BASE_URL}/profile/${user.avatar}`
      : `${process.env.DEFAULT_PROFILE_PIC}`;

    return res.status(201).json(new ApiResponse(200, user, Msg.DATA_FETCHED));
  } catch (error) {
    console.log(`error while getting user by id`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
