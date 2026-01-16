import Joi from "joi";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import Flashcard from "../../models/flashcard/flashcard.js";


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

 export const deleteFlashCardHandle = async(req,res)=>{
    try {
        const {id} = req.params;
        const schema = Joi.object({
            id: Joi.string().required(),
        });
        
        const {error} = schema.validate(req.params);
        if(error){
            return res.status(400).json(new ApiResponse(400, {}, error.details[0].message));
        }

        const flashcard = await Flashcard.findByIdAndDelete(id);
        if(!flashcard){
            return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
        }
        return res.status(200).json(new ApiResponse(200, {}, Msg.DATA_DELETED));
        
    } catch (error) {
        console.log(`Error while deleting flashcard :`, error);
        return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
    }
 }

 export const changeStatusOfCardHandle= async(req, res)=>{
    try {
        const { id }= req.params;
        const schema = Joi.object({
            id: Joi.string().required(),
        });
        
        const {error} = schema.validate(req.params);
        if(error){
            return res.status(400).json(new ApiResponse(400, {}, error.details[0].message));
        }

        const flashcard = await Flashcard.findById(id);
        if(!flashcard){
            return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
        }

        flashcard.status = flashcard.status === true ? false : true;
        await flashcard.save();
        return res.status(200).json(new ApiResponse(200, {}, Msg.DATA_UPDATED));
        
    } catch (error) {
        console.log(`Error while changing status of flashcard :`, error);
        return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
    }
 }



