const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

AWS.config.update({ region: process.env.AWS_REGION || "ap-southeast-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const ORDER_HISTORIES_TABLE_NAME =
  process.env.ORDER_HISTORIES_TABLE_NAME || "ShopOrderHistories";

class OrderHistory {
  constructor({ id, userId, orderId, status, createdAt, updatedAt }) {
    this.id = id;
    this.userId = userId;
    this.orderId = orderId;
    this.status = status || "pending";
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static async create(historyData) {
    console.log("[OrderHistoryModel] create called with:", historyData);
    const history = new OrderHistory({
      ...historyData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const params = {
      TableName: ORDER_HISTORIES_TABLE_NAME,
      Item: { ...history },
    };
    await dynamoDb.put(params).promise();
    return history;
  }

  static async findByUserId(userId) {
    const params = {
      TableName: ORDER_HISTORIES_TABLE_NAME,
      IndexName: "UserIdIndex",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    };
    const result = await dynamoDb.query(params).promise();
    return result.Items
      ? result.Items.map((item) => new OrderHistory(item))
      : [];
  }

  static async findByOrderId(orderId) {
    const params = {
      TableName: ORDER_HISTORIES_TABLE_NAME,
      IndexName: "OrderIdIndex",
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: { ":orderId": orderId },
    };
    const result = await dynamoDb.query(params).promise();
    return result.Items
      ? result.Items.map((item) => new OrderHistory(item))
      : [];
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    const params = {
      TableName: ORDER_HISTORIES_TABLE_NAME,
      Item: { ...this },
    };
    await dynamoDb.put(params).promise();
    return this;
  }
}

module.exports = OrderHistory;
