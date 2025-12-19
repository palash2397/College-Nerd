import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import Program from "../../models/program/program.js";
import Joi from 'joi';

export const programHandle = async (req, res) => {
    try {
        const { programName } = req.body;

        // Input validation
        const schema = Joi.object({
            programName: Joi.string()
                .required()
                .max(50)
                .messages({
                    'string.empty': 'Program name is required',
                    'string.max': 'Program name cannot be more than 50 characters',
                    'any.required': 'Program name is required'
                })
        });

        const { error } = schema.validate({ programName });
        if (error) {
            return res
                .status(400)
                .json(new ApiResponse(400, {}, error.details[0].message));
        }

        // Check if program already exists
        const existingProgram = await Program.findOne({ programName });
        if (existingProgram) {
            return res
                .status(400)
                .json(new ApiResponse(400, {}, 'Program with this name already exists'));
        }

        // Create new program
        const program = await Program.create({ programName });

        return res
            .status(201)
            .json(new ApiResponse(201, program, 'Program created successfully'));

    } catch (error) {
        console.error('Error in programHandle:', error);
        return res
            .status(500)
            .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
    }
};


export const deleteProgramHandle = async (req, res) => {
    try {
        const { id } = req.params;

        // Input validation using Joi
        const schema = Joi.object({
            id: Joi.string()
                .required()
                .messages({
                    'string.empty': 'Program ID is required',
                    'any.required': 'Program ID is required'
                })
        });

        const { error } = schema.validate({ id });
        if (error) {
            return res
                .status(400)
                .json(new ApiResponse(400, {}, error.details[0].message));
        }

        
        const program = await Program.findById(id);
        if (!program) {
            return res
                .status(404)
                .json(new ApiResponse(404, {}, 'Program not found'));
        }

        await Program.findByIdAndDelete(id);

        return res
            .status(200)
            .json(new ApiResponse(200, {}, Msg.DATA_DELETED));

    } catch (error) {
        console.error('Error in deleteProgramHandle:', error);
        return res
            .status(500)
            .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
    }
};
