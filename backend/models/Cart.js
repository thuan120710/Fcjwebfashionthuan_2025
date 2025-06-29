const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

AWS.config.update({ region: process.env.AWS_REGION || "ap-southeast-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const CARTS_TABLE_NAME = process.env.CARTS_TABLE_NAME || "ShopCarts";

class Cart {
  constructor({ id, userId, items, totalPrice, createdAt, updatedAt }) {
    this.id = id;
    this.userId = userId;
    this.items = items || [];
    this.totalPrice = totalPrice || 0;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static async findOne(query) {
    if (query.userId) {
      const params = {
        TableName: CARTS_TABLE_NAME,
        IndexName: "UserIdIndex",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": query.userId },
      };
      const result = await dynamoDb.query(params).promise();
      if (result.Items && result.Items.length > 0) {
        return new Cart(result.Items[0]);
      }
      return null;
    }
    return null;
  }

  static async create(cartData) {
    const cart = new Cart({
      ...cartData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const params = {
      TableName: CARTS_TABLE_NAME,
      Item: { ...cart },
    };
    await dynamoDb.put(params).promise();
    return cart;
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    const params = {
      TableName: CARTS_TABLE_NAME,
      Item: { ...this },
    };
    await dynamoDb.put(params).promise();
    return this;
  }

  static async deleteCart(id) {
    const params = {
      TableName: CARTS_TABLE_NAME,
      Key: { id },
    };
    await dynamoDb.delete(params).promise();
    return true;
  }
}

module.exports = Cart;
