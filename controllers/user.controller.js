import {ApiResponse} from "../utils/ApiResponse.js";

export const registerHandle = async (req, res) => {
    try {

      return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    {},
                    `The OTP has been successfully sent to your registered email and phone number. Please check your inbox or phone messages.`
                )
            );
    } catch (error) {
        console.error(`Error while registering user:`, error);
        return res
            .status(500)
            .json(new ApiResponse(500, {}, `Internal Server Error`));

    }
}