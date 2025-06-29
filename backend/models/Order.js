const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

AWS.config.update({ region: process.env.AWS_REGION || "ap-southeast-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const ORDERS_TABLE_NAME = process.env.ORDERS_TABLE_NAME || "ShopOrders";

class Order {
  constructor({
    id,
    userId,
    orderItems,
    shippingAddress,
    paymentMethod,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
    status,
    createdAt,
    updatedAt,
    coupon = null,
    discount = 0,
    shippingCoupon = null,
    shippingDiscount = 0,
  }) {
    this.id = id;
    this.userId = userId;
    this.orderItems = orderItems || [];
    this.shippingAddress = shippingAddress;
    this.paymentMethod = paymentMethod;
    this.taxPrice = taxPrice || 0;
    this.shippingPrice = shippingPrice || 0;
    this.totalPrice = totalPrice || 0;
    this.isPaid = isPaid || false;
    this.paidAt = paidAt;
    this.isDelivered = isDelivered || false;
    this.deliveredAt = deliveredAt;
    this.status = status || "pending";
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.coupon = coupon;
    this.discount = discount || 0;
    this.shippingCoupon = shippingCoupon;
    this.shippingDiscount = shippingDiscount || 0;
  }

  static async create(orderData) {
    console.log("[OrderModel] create called with:", orderData);
    const order = new Order({
      ...orderData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const params = {
      TableName: ORDERS_TABLE_NAME,
      Item: { ...order },
    };
    await dynamoDb.put(params).promise();
    return order;
  }

  static async findById(id) {
    const params = {
      TableName: ORDERS_TABLE_NAME,
      Key: { id: id },
    };
    const result = await dynamoDb.get(params).promise();
    return result.Item ? new Order(result.Item) : null;
  }

  static async findByUserId(userId) {
    const params = {
      TableName: ORDERS_TABLE_NAME,
      IndexName: "UserIdIndex",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    };
    const result = await dynamoDb.query(params).promise();
    return result.Items ? result.Items.map((item) => new Order(item)) : [];
  }

  static async findAll() {
    const params = {
      TableName: ORDERS_TABLE_NAME,
    };
    const result = await dynamoDb.scan(params).promise();
    return result.Items ? result.Items.map((item) => new Order(item)) : [];
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    const params = {
      TableName: ORDERS_TABLE_NAME,
      Item: { ...this },
    };
    await dynamoDb.put(params).promise();
    return this;
  }
}

module.exports = Order;
