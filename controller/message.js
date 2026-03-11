const Messages = require("../model/messages");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const express = require("express");
const { upload } = require("../multer");
const { getChatBlockInfo } = require("../utils/chatGuards");
const { createChatNotification } = require("../utils/notificationHelper");
const router = express.Router();
const path = require("path");

// create new message
router.post(
  "/create-new-message",
  upload.single("images"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const messageData = req.body;

      if (req.file) {
        const filename = req.file.filename;
        const fileUrl = path.join(filename);
        messageData.images = fileUrl;
      }

      messageData.conversationId = req.body.conversationId;
      messageData.sender = req.body.sender;
      messageData.text = req.body.text;

      const chatGate = await getChatBlockInfo(messageData.conversationId);
      if (chatGate.blocked) {
        return next(new ErrorHandler(chatGate.reason, 403));
      }

      const message = new Messages({
        conversationId: messageData.conversationId,
        text: messageData.text,
        sender: messageData.sender,
        images: messageData.images ? messageData.images : undefined,
      });

      await message.save();

      // Send chat notification to the recipient
      try {
        const messageText = messageData.text || (messageData.images ? "Sent an image" : "Sent a message");
        await createChatNotification(
          messageData.conversationId,
          messageData.sender,
          messageText
        );
        console.log("Chat notification sent successfully");
      } catch (notificationError) {
        console.error("Error sending chat notification:", notificationError);
        // Don't fail the message creation if notification fails
      }

      res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message), 500);
    }
  })
);

// get all messages with conversation id
router.get(
  "/get-all-messages/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const messages = await Messages.find({
        conversationId: req.params.id,
      });

      res.status(201).json({
        success: true,
        messages,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message), 500);
    }
  })
);

module.exports = router;
