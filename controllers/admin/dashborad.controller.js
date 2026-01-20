import User from "../../models/user/user.js";
import Lecture from "../../models/lecture/lecture.js";
import Flashcard from "../../models/flashcard/flashcard.js";
import Payment from "../../models/payment/payment.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import Joi from "joi";

export const dashboardHandle = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCards,
      totalLectures,
      revenueResult,
    ] = await Promise.all([
      User.countDocuments(),
      Flashcard.countDocuments(),
      Lecture.countDocuments(),
      Payment.aggregate([
        { $match: { status: "success" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalUsers,
          totalLectures,
          totalCards,
          totalRevenue,
        },
        Msg.DATA_FETCHED
      )
    );
  } catch (error) {
    console.log(`error while getting dashboard data`, error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};


export const userStatsHandle = async (req, res) => {
  try {
    const [userStats, lectureStats] = await Promise.all([
      // User growth by month
      User.aggregate([
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Lecture uploads by day
      Lecture.aggregate([
        {
          $group: {
            _id: { $dayOfWeek: "$createdAt" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const monthMap = {
      1: "Jan",
      2: "Feb",
      3: "Mar",
      4: "Apr",
      5: "May",
      6: "Jun",
      7: "Jul",
      8: "Aug",
      9: "Sep",
      10: "Oct",
      11: "Nov",
      12: "Dec",
    };

    const dayMap = {
      2: "Mon",
      3: "Tue",
      4: "Wed",
      5: "Thu",
      6: "Fri",
      7: "Sat",
    };

    const userGrowth = {};
    userStats.forEach((item) => {
      userGrowth[monthMap[item._id]] = item.count;
    });

    const lectureUploads = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };

    lectureStats.forEach((item) => {
      const day = dayMap[item._id];
      if (day) lectureUploads[day] = item.count;
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { userGrowth, lectureUploads }, Msg.DATA_FETCHED)
      );
  } catch (error) {
    console.log("Error while getting dashboard stats", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const latestUsersHandle = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select(
        "-password -otp -otpExpireAt -otpVerifiedForResetPassword -updatedAt -__v -googleId"
      );

    users.map((user) => {
      user.avatar = user.avatar
        ? `${process.env.BASE_URL}/profile/${user.avatar}`
        : `${process.env.DEFAULT_PROFILE_PIC}`;
    });
    return res.status(200).json(new ApiResponse(200, users, Msg.DATA_FETCHED));
  } catch (error) {
    console.log(`error while getting latest users`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const addUserHandle = async (req, res) => {
  try {
    const { name, email, password, countryCode, phoneNumber, status, program } =
      req.body;
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      countryCode: Joi.string().required(),
      phoneNumber: Joi.string().required(),
      status: Joi.string().required(),
      program: Joi.string().required(),
    });

    const { error } = schema.validate({
      name,
      email,
      password,
      countryCode,
      phoneNumber,
      status,
      program,
    });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

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

    const user = new User({
      name,
      email,
      password,
      countryCode,
      phoneNumber,
      avatar: req.file?.filename || "",
      isVerified: true,
      isActive: status,
      program,
    });

    await user.save();

    return res.status(201).json(new ApiResponse(201, user, Msg.USER_CREATED));
  } catch (error) {
    console.log(`error while adding user`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const allLecturesHandle = async (req, res) => {
  try {
    const lectures = await Lecture.find();
    return res.status(200).json(new ApiResponse(200, lectures, Msg.DATA_FETCHED));
  } catch (error) {
    console.log(`error while getting all lectures`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
}

export const searchUserHandle = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status, program } = req.query;
    
    // Build search query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }
    
    // Add filters
    if (status) {
      query.isActive = status === 'active' ? true : false;
    }
    
    if (program) {
      query.program = program;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const users = await User.find(query)
      .select("-password -otp -otpExpireAt -__v -googleId -otpVerifiedForResetPassword")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    // Format avatar URLs
    users.forEach(user => {
      user.avatar = user.avatar
        ? `${process.env.BASE_URL}/profile/${user.avatar}`
        : `${process.env.DEFAULT_PROFILE_PIC}`;
    });
    
    return res.status(200).json(new ApiResponse(200, {
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }, Msg.DATA_FETCHED));
    
  } catch (error) {
    console.log(`error while searching user`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
}
