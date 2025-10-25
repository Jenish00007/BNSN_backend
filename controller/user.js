const express = require("express");
const path = require("path");
const User = require("../model/user");
const { upload } = require("../multer");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../config/email.config");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const crypto = require("crypto");

const router = express.Router();

router.post("/create-user", upload.single("file"), async (req, res, next) => {
  try {
    console.log('Registration request received:', {
      body: req.body,
      file: req.file ? {
        filename: req.file.filename,
        location: req.file.location
      } : null
    });

    const { name, email, password, phoneNumber } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !phoneNumber) {
      console.log('Missing required fields:', { name, email, phoneNumber });
      return next(new ErrorHandler("All fields are required", 400));
    }

    // Check if user exists
    const userEmail = await User.findOne({ email: email.toLowerCase().trim() });
    console.log('Existing user check:', userEmail ? 'User found' : 'No user found');

    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    if (!req.file) {
      return next(new ErrorHandler("Please upload an avatar", 400));
    }

    // Create user object
    const userData = {
      name,
      email: email.toLowerCase().trim(),
      password,
      phoneNumber,
      avatar: req.file.location
    };
    console.log('Creating user with data:', { ...userData, password: '[REDACTED]' });

    try {
      // Create user
      const user = await User.create(userData);
      console.log('User created successfully:', { 
        id: user._id, 
        email: user.email, 
        name: user.name 
      });

      // Send response
      const token = user.getJwtToken();
      console.log('Generated token for user');

      res.status(201).json({
        success: true,
        message: "User registered successfully!",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar
        }
      });
    } catch (dbError) {
      console.error('Database error during user creation:', dbError);
      return next(new ErrorHandler(dbError.message, 400));
    }
  } catch (err) {
    console.error('Registration error:', err);
    return next(new ErrorHandler(err.message, 400));
  }
});

// update user push token
router.put(
  "/expo-push-token",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { token } = req.body;

      if (!token) {
        return next(new ErrorHandler("Push token is required", 400));
      }

      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Update push token
      user.pushToken = token;
      await user.save();

      console.log(`Push token updated for user ${user.email}: ${token}`);

      res.status(200).json({
        success: true,
        message: "Push token updated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar,
          pushToken: user.pushToken
        }
      });
    } catch (error) {
      console.error('Error updating push token:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log('Login attempt with:', { 
        email: req.body.email,
        phoneNumber: req.body.phoneNumber 
      });
      
      const { email, phoneNumber, password, pushToken } = req.body;

      if ((!email && !phoneNumber) || !password) {
        console.log('Missing credentials');
        return next(new ErrorHandler("Please provide email/phone and password", 400));
      }

      // Find user with either email or phone number
      let user;
      if (email) {
        user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
      } else {
        user = await User.findOne({ phoneNumber }).select("+password");
      }
      
      console.log('User lookup result:', user ? 'User found' : 'User not found');

      if (!user) {
        console.log('No user found');
        return next(new ErrorHandler("User doesn't exist", 400));
      }

      // compare password with database password
      const isPasswordValid = await user.comparePassword(password);
      console.log('Password validation:', isPasswordValid ? 'Valid' : 'Invalid');

      if (!isPasswordValid) {
        console.log('Invalid password');
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      // Update push token if provided
      if (pushToken) {
        user.pushToken = pushToken;
        await user.save();
        console.log(`Push token updated for user ${user.email}: ${pushToken}`);
      }

      console.log('Login successful');
      
      // Generate token
      const token = user.getJwtToken();
      
      // Return user data without sensitive information
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        pushToken: user.pushToken
      };

      res.status(201).json({
        success: true,
        token,
        user: userData
      });
    } catch (error) {
      console.error('Login error:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// load user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// log out user
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, phoneNumber, name, address } = req.body;

      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      // Check if email is being changed and if it's already taken
      if (email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return next(new ErrorHandler("Email already exists", 400));
        }
      }

      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;
      if (address) user.address = address;

      await user.save();

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  upload.single("image"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const existsUser = await User.findById(req.user.id);

      // Get the S3 URL from the uploaded file
      const imageUrl = req.file.location;

      if (!imageUrl) {
        return next(new ErrorHandler("Failed to upload image to S3", 500));
      }

      const user = await User.findByIdAndUpdate(req.user.id, {
        avatar: imageUrl,
      });

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user addresses
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );
      if (sameTypeAddress) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exists`)
        );
      }

      const existsAddress = user.addresses.find(
        (address) => address._id === req.body._id
      );

      if (existsAddress) {
        Object.assign(existsAddress, req.body);
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete user address
router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;

      //   console.log(addressId);

      await User.updateOne(
        {
          _id: userId,
        },
        { $pull: { addresses: { _id: addressId } } }
      );

      const user = await User.findById(userId);

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user password
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      const isPasswordMatched = await user.comparePassword(
        req.body.oldPassword
      );

      if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect!", 400));
      }

      /* The line `if (req.body.newPassword !== req.body.confirmPassword)` is checking if the value of
    `newPassword` in the request body is not equal to the value of `confirmPassword` in the request
    body. This is used to ensure that the new password entered by the user matches the confirmation
    password entered by the user. If the two values do not match, it means that the user has entered
    different passwords and an error is returned. */
      if (req.body.newPassword !== req.body.confirmPassword) {
        return next(
          new ErrorHandler("Password doesn't matched with each other!", 400)
        );
      }
      user.password = req.body.newPassword;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// find user infoormation with the userId
router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all users --- for admin
router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete users --- admin
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("User is not available with this id", 400)
        );
      }

      await User.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "User deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// forgot password
router.post(
  "/forgot-password",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return next(new ErrorHandler("User not found with this email", 404));
      }

      // Generate OTP
      const otp = user.generateOTP();
      await user.save({ validateBeforeSave: false });

      const emailTemplate = `Your OTP for password reset is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you have not requested this email then, please ignore it.`;
      
      try {
        
        await sendEmail(user.email, `Password Recovery OTP`, emailTemplate);
        
        res.status(200).json({
          success: true,
          message: `OTP sent to ${user.email} successfully`,
        });
      } catch (error) {
        user.otp = undefined;
        user.otpExpiry = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler(error.message, 500));
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// verify OTP
router.post(
  "/verify-otp",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, phoneNumber, otp } = req.body;

      if (!otp) {
        return next(new ErrorHandler("Please provide OTP", 400));
      }

      let user;
      if (email) {
        user = await User.findOne({ email });
      } else if (phoneNumber) {
        user = await User.findOne({ phoneNumber });
      } else {
        return next(new ErrorHandler("Please provide either email or phone number", 400));
      }

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Prevent admin user login through OTP
      if (user.role === "Admin") {
        return next(new ErrorHandler("Admin users cannot login through OTP", 403));
      }

      const isValidOTP = user.verifyOTP(otp);

      if (!isValidOTP) {
        return next(new ErrorHandler("Invalid or expired OTP", 400));
      }

      // Generate token for successful verification
      const token = user.getJwtToken();

      // Only return non-sensitive user data
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified
      };

      // Set the token in a cookie
      res.cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
      });

      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        token,
        user: userData
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// reset password
router.put(
  "/reset-password",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, otp, password, confirmPassword } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const isValidOTP = user.verifyOTP(otp);

      if (!isValidOTP) {
        return next(new ErrorHandler("Invalid or expired OTP", 400));
      }

      if (password !== confirmPassword) {
        return next(new ErrorHandler("Password doesn't match", 400));
      }

      user.password = password;
      user.otp = undefined;
      user.otpExpiry = undefined;

      await user.save();

      sendToken(user, 200, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Send OTP for phone login
router.post(
  "/send-otp",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return next(new ErrorHandler("Please provide phone number", 400));
      }

      // Find user by phone number
      const user = await User.findOne({ phoneNumber });

      if (!user) {
        return next(new ErrorHandler("No user found with this phone number", 404));
      }

      // Generate OTP
      const otp = user.generateOTP();
      await user.save();

      // TODO: Integrate with SMS service to send OTP
      // For development, we'll just return the OTP
      console.log(`OTP for ${phoneNumber}: ${otp}`);

      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        // Remove this in production
        otp: process.env.NODE_ENV === "development" ? otp : undefined
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// login admin
router.post(
  "/login-admin",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide email and password", 400));
      }

      // Find admin user
      const user = await User.findOne({ email: email.toLowerCase().trim(), role: "Admin" }).select("+password");

      if (!user) {
        return next(new ErrorHandler("Invalid admin credentials", 401));
      }

      // compare password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(new ErrorHandler("Invalid admin credentials", 401));
      }

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
