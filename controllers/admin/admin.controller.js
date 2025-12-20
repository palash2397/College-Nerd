import Faq from "../../models/faq/faq.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
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

        return res
            .status(201)
            .json(new ApiResponse(200, data._id, Msg.DATA_ADDED));
    } catch (error) {
        console.log(`error while adding faq ${error}`);
        res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
    }
};

