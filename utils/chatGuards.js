const Conversation = require("../model/conversation");
const Product = require("../model/product");

const PRODUCT_INACTIVE_MESSAGE =
  "This conversation is disabled because the listing is no longer active.";

const PRODUCT_SOLD_MESSAGE =
  "This conversation is disabled because the seller marked the item as sold.";

const getChatBlockInfo = async (conversationId) => {
  if (!conversationId) {
    return {
      blocked: true,
      reason: "Conversation not found.",
    };
  }

  const conversation = await Conversation.findById(conversationId).lean();

  if (!conversation) {
    return {
      blocked: true,
      reason: "Conversation not found.",
    };
  }

  if (!conversation.productId) {
    return { blocked: false };
  }

  const product = await Product.findById(conversation.productId).select(
    "status name"
  );

  if (!product) {
    return { blocked: false };
  }

  if (product.status && product.status !== "active") {
    return {
      blocked: true,
      reason:
        product.status === "sold"
          ? PRODUCT_SOLD_MESSAGE
          : PRODUCT_INACTIVE_MESSAGE,
      productStatus: product.status,
      productName: product.name,
    };
  }

  return { blocked: false };
};

module.exports = { getChatBlockInfo };

