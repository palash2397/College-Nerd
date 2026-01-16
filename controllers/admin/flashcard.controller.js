import Joi from "joi";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import Flashcard from "../../models/flashcard/flashcard.js";
import User from "../../models/user/user.js";

export const createFlashCardHandle = async (req, res) => {
  try {
    const { question, answer, topic } = req.body;
    const schema = Joi.object({
      question: Joi.string().required(),
      answer: Joi.string().required(),
      topic: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const flashcard = await Flashcard.create({
      question,
      answer,
      topic,
      createdBy: req.user.id,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, flashcard, Msg.DATA_CREATED));
  } catch (error) {
    console.log(`Error while creating flashcard :`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

// export const deleteFlashCardHandle = async(req,)
