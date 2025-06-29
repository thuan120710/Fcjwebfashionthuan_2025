const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

AWS.config.update({ region: process.env.AWS_REGION || "ap-southeast-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const PAYMENTS_TABLE_NAME = process.env.PAYMENTS_TABLE_NAME || "ShopPayments";

class Payment {
  constructor({
    id,
    order,
    user,
    paymentMethod,
    amount,
    currency = "VND",
    status = "pending",
    transactionId,
    paymentDetails = {},
    billingAddress = {},
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.order = order;
    this.user = user;
    this.paymentMethod = paymentMethod;
    this.amount = amount;
    this.currency = currency;
    this.status = status;
    this.transactionId = transactionId;
    this.paymentDetails = paymentDetails;
    this.billingAddress = billingAddress;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  static async create(data) {
    const payment = new Payment({
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const params = {
      TableName: PAYMENTS_TABLE_NAME,
      Item: { ...payment },
    };
    await dynamoDb.put(params).promise();
    return payment;
  }

  static async findById(id) {
    const params = {
      TableName: PAYMENTS_TABLE_NAME,
      Key: { id },
    };
    const result = await dynamoDb.get(params).promise();
    return result.Item ? new Payment(result.Item) : null;
  }

  static async findByUser(userId) {
    // Cần tạo GSI cho user nếu muốn query nhanh
    const params = {
      TableName: PAYMENTS_TABLE_NAME,
      IndexName: "UserIdIndex",
      KeyConditionExpression: "user = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    };
    const result = await dynamoDb.query(params).promise();
    return result.Items ? result.Items.map((item) => new Payment(item)) : [];
  }

  static async findAll({ limit = 10, skip = 0 } = {}) {
    const params = {
      TableName: PAYMENTS_TABLE_NAME,
    };
    const result = await dynamoDb.scan(params).promise();
    let items = result.Items || [];
    // Sort by createdAt desc
    items = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return items.slice(skip, skip + limit).map((item) => new Payment(item));
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    const params = {
      TableName: PAYMENTS_TABLE_NAME,
      Item: { ...this },
    };
    await dynamoDb.put(params).promise();
    return this;
  }

  static async updateStatus(id, status, transactionId) {
    const payment = await Payment.findById(id);
    if (!payment) throw new Error("Không tìm thấy thanh toán");
    payment.status = status || payment.status;
    if (transactionId) payment.transactionId = transactionId;
    await payment.save();
    return payment;
  }
}

module.exports = Payment;
