export const Msg = {
  // General
  SERVER_ERROR: `Internal server error`,
  SUCCESS: `Success`,
  VALIDATION_ERROR: `Validation failed`,
  BAD_REQUEST: `Bad request`,

  // User
  USER_REGISTER: `User registered successfully`,
  USER_LOGIN: `User logged in successfully`,
  USER_EXISTS: `User already exists`,
  USER_ALREADY_VERIFIED: `User Already verified`,
  USER_NOT_VERIFIED: `User not verified`,
  USER_NOT_FOUND: `User not found`,
  ACCOUNT_DEACTIVATED: `Account has been temporarily deactivated`,
  ACCOUNT_VERIFIED: `User account verified successfully.`,

  
  // Admin
  USER_ACCOUNT_DEACTIVATED: `Account has been deactivated successfully`,

  
  // Authentication
  INVALID_CREDENTIALS: `Invalid Credentials`,
  LOGIN_SUCCESS: `Login successful`,
  LOGOUT_SUCCESS: `Logout successful`,
  UNAUTHORIZED: `Unauthorized access`,
  FORBIDDEN: `Access forbidden`,
  TOKEN_EXPIRED: `Token has expired`,
  TOKEN_INVALID: `Invalid token`,
  PASSWORD_CHANGED: `Password changed successfully`,
  PASSWORD_INCORRECT: `Incorrect password`,
  PASSWORD_OLD_INCORRECT: `Incorrect old password`,
  ENTERED_OLD_PASSWORD: `You have entered your old password. Please enter a new password`,

  // Data
  DATA_FETCHED: `Data fetched successfully`,
  DATA_GENERATED: `Data generated successfully`,
  DATA_NOT_FOUND: `No data found`,
  DATA_UPDATED: `Data updated successfully`,
  DATA_DELETED: `Data deleted successfully`,
  DATA_ADDED: `Data added successfully`,
  DATA_REQUIRED: `Data is required`,
  DATA_ALREADY_EXISTS: `Data  already exists`,

  // OTP
  OTP_SENT: `The OTP has been successfully sent to your registered email. Please check your inbox.`,
  OTP_VERIFIED: `OTP verified successfully`,
  OTP_NOT_VERIFIED: `OTP not verified. Please verify OTP.`,
  OTP_EXPIRED: `OTP has expired`,
  OTP_INVALID: `Invalid or expired OTP`,
  OTP_RESENT: `OTP resent successfully`,
  OTP_LIMIT_EXCEEDED: `OTP request limit exceeded, please try again later`,
  OTP_NOT_FOUND: `OTP not found. Please request a new OTP.`,

  // Verification
  EMAIL_VERIFIED: `Email verified successfully`,
  EMAIL_ALREADY_VERIFIED: `Email already verified`,
  PHONE_VERIFIED: `Phone number verified successfully`,
  PHONE_ALREADY_VERIFIED: `Phone number already verified`,


  // Subscription
  SUBSCRIPTION_REQUIRED: `You need an active subscription to use this feature`,
  SUBSCRIPTION_EXPIRED: `Your subscription has expired. Please renew to continue.`,
  SUBSCRIPTION_INACTIVE: `Your subscription is not active`,
  SUBSCRIPTION_PLAN_ADDED: `Subscription plan added successfully`,
  SUBSCRIPTION_PLAN_UPDATED: `Subscription plan updated successfully`,
  SUBSCRIPTION_PLAN_DELETED: `Subscription plan deleted successfully`,
  SUBSCRIPTION_PLAN_NOT_FOUND: `Subscription plan not found`,
  SUBSCRIPTION_ACTIVATED: `Subscription activated successfully`,
};