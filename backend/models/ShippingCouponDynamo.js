const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME =
  process.env.SHIPPING_COUPONS_TABLE_NAME || "ShopShippingCoupons";

function isValid(coupon) {
  const now = new Date();
  return (
    coupon.isActive &&
    now >= new Date(coupon.startDate) &&
    now <= new Date(coupon.endDate) &&
    (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit)
  );
}

function calculateDiscount(coupon, shippingPrice) {
  if (!isValid(coupon)) return 0;
  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (shippingPrice * coupon.discountValue) / 100;
  } else {
    discount = coupon.discountValue;
  }
  if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
    discount = coupon.maximumDiscount;
  }
  return discount;
}

async function createCoupon(data) {
  const coupon = {
    id: uuidv4(),
    code: data.code.toUpperCase(),
    description: data.description || "",
    discountType: data.discountType || "percentage",
    discountValue: parseFloat(data.discountValue) || 0,
    maximumDiscount: data.maximumDiscount
      ? parseFloat(data.maximumDiscount)
      : undefined,
    startDate: data.startDate
      ? new Date(data.startDate).toISOString()
      : new Date().toISOString(),
    endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    isActive: data.isActive !== undefined ? data.isActive : true,
    usageLimit: data.usageLimit ? parseInt(data.usageLimit) : undefined,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await ddbDocClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: coupon })
  );
  return coupon;
}

async function getCouponByCode(code) {
  const params = {
    TableName: TABLE_NAME,
    IndexName: "CodeIndex",
    KeyConditionExpression: "#code = :code",
    ExpressionAttributeNames: { "#code": "code" },
    ExpressionAttributeValues: { ":code": code.toUpperCase() },
  };
  const result = await ddbDocClient.send(new QueryCommand(params));
  return result.Items && result.Items[0];
}

async function getCouponById(id) {
  const params = {
    TableName: TABLE_NAME,
    Key: { id },
  };
  const result = await ddbDocClient.send(new GetCommand(params));
  return result.Item;
}

async function getAllCoupons() {
  const params = { TableName: TABLE_NAME };
  const result = await ddbDocClient.send(new ScanCommand(params));
  return result.Items || [];
}

async function updateCoupon(id, data) {
  const oldCoupon = await getCouponById(id);
  if (!oldCoupon) return null;
  const updated = {
    ...oldCoupon,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await ddbDocClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: updated })
  );
  return updated;
}

async function deleteCoupon(id) {
  await ddbDocClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { id } })
  );
  return true;
}

async function incrementUsageCount(id) {
  const coupon = await getCouponById(id);
  if (!coupon) return null;
  coupon.usageCount = (coupon.usageCount || 0) + 1;
  coupon.updatedAt = new Date().toISOString();
  await ddbDocClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: coupon })
  );
  return coupon;
}

module.exports = {
  createCoupon,
  getCouponByCode,
  getCouponById,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  incrementUsageCount,
  isValid,
  calculateDiscount,
};
