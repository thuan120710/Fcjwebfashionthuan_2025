const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const TABLE_NAME = process.env.REVIEWS_TABLE_NAME || "ShopReviews";
const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const ReviewDynamo = {
  async createReview({ userId, productId, rating, comment, title }) {
    const now = new Date().toISOString();
    const review = {
      id: uuidv4(),
      userId,
      productId,
      rating,
      comment,
      title: title || "",
      createdAt: now,
      updatedAt: now,
    };
    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: review }));
    return review;
  },

  async getReviewsByProduct(productId) {
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "ProductIndex",
        KeyConditionExpression: "productId = :pid",
        ExpressionAttributeValues: { ":pid": productId },
        ScanIndexForward: false,
      })
    );
    return result.Items || [];
  },

  async getReviewsByUser(userId) {
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "UserIndex",
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
        ScanIndexForward: false,
      })
    );
    return result.Items || [];
  },

  async getAllReviews() {
    const result = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }));
    return result.Items || [];
  },

  async updateReview(id, { rating, comment, title }) {
    const now = new Date().toISOString();
    const updateExp = [];
    const expAttr = { ":updatedAt": now };
    if (rating !== undefined) {
      updateExp.push("rating = :rating");
      expAttr[":rating"] = rating;
    }
    if (comment !== undefined) {
      updateExp.push("comment = :comment");
      expAttr[":comment"] = comment;
    }
    if (title !== undefined) {
      updateExp.push("title = :title");
      expAttr[":title"] = title;
    }
    const UpdateExpression =
      "set " + updateExp.join(", ") + ", updatedAt = :updatedAt";
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression,
        ExpressionAttributeValues: expAttr,
        ReturnValues: "ALL_NEW",
      })
    );
    return true;
  },

  async deleteReview(id) {
    await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
    return true;
  },
};

module.exports = ReviewDynamo;
