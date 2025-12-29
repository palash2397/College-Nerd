import { ApiResponse } from "../../utils/ApiResponse.js";
import { OAuth2Client } from "google-auth-library";
// import jwt from "jsonwebtoken";
import Joi from "joi";
import User from "../../models/user/user.js";
import { Msg } from "../../utils/responseMsg.js";


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuthSignupHandle = async (req, res) => {
  try {
    const idToken = req.params.id;
    const schema = Joi.object({
      idToken: Joi.string().required(),
    });
    const { error } = schema.validate({ idToken });
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    console.log("ticket --------->", ticket)

    const payload = ticket.getPayload();
    console.log("payload --------->", payload)
    const { sub: googleId, email } = payload;

    let user = await User.findOne({ email });
    if (user && user.provider === "local") {
      return res
        .status(401)
        .json(
          new ApiResponse(
            400,
            {},
            Msg.USER_EXISTS
          )
        );
    }

    user = await User.create({
      email: email,
      googleId: googleId,
      provider: "google",
      isVerified: true,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { id: user._id, email: user.email },
          `google signup  successful`
        )
      );
  } catch (error) {
    console.log(`Error while signup with google: ${error.message}`);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
