const AWS = require("aws-sdk");

// Cấu hình AWS SDK cho region của bạn
AWS.config.update({ region: process.env.AWS_REGION || "ap-southeast-1" });

// Tạo DynamoDB DocumentClient
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.PRODUCTS_TABLE_NAME || "ShopProducts"; // Lấy tên bảng từ biến môi trường

function removeVietnameseTones(str) {
  return str
    .normalize("NFD")
    .replace(/\u0300-\u036f/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

class Product {
  constructor({
    id,
    name,
    description,
    price,
    image,
    images,
    brand,
    category,
    countInStock,
    rating,
    numReviews,
    isDeleted,
    deletedAt,
    reviews,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.images = Array.isArray(images)
      ? images
      : typeof images === "string" && images
      ? images
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      : image
      ? [image]
      : [];
    this.image = this.images[0] || "";
    // brand và category sẽ được lưu dưới dạng ID (string) của chúng trong DynamoDB
    this.brand = brand;
    this.category = category;
    this.countInStock = Number(countInStock);
    if (isNaN(this.countInStock) || this.countInStock < 0)
      this.countInStock = 0;
    this.rating = rating !== undefined ? rating : 0;
    this.numReviews = numReviews !== undefined ? numReviews : 0;
    this.isDeleted = isDeleted !== undefined ? isDeleted : false;
    this.deletedAt = deletedAt;
    this.reviews = reviews !== undefined ? reviews : []; // Review sẽ là một mảng nhúng
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  // Phương thức để lưu sản phẩm mới/cập nhật vào DynamoDB
  async save() {
    if (!this.id) {
      this.id = AWS.util.uuid.v4(); // Tạo ID duy nhất nếu chưa có
      this.createdAt = new Date().toISOString();
    }
    this.updatedAt = new Date().toISOString();
    if (!Array.isArray(this.images)) {
      if (typeof this.images === "string") {
        this.images = this.images
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (this.image) {
        this.images = [this.image];
      } else {
        this.images = [];
      }
    }
    this.image = this.images[0] || "";
    const params = {
      TableName: TABLE_NAME,
      Item: { ...this },
    };
    await dynamoDb.put(params).promise();
    return this;
  }

  // Static method để tìm sản phẩm bằng ID
  static async findById(id) {
    console.log("[ProductModel] findById called with id:", id);
    const params = {
      TableName: TABLE_NAME,
      Key: { id: id },
    };
    const result = await dynamoDb.get(params).promise();
    console.log("[ProductModel] findById result:", result);
    if (result.Item && !result.Item.isDeleted) {
      return new Product(result.Item);
    }
    return null;
  }

  // Static method để lấy tất cả sản phẩm (có thể lọc)
  static async find(query = {}, options = {}) {
    const params = {
      TableName: TABLE_NAME,
    };

    // Với DynamoDB, việc thực hiện các query phức tạp như MongoDB (regex, range, multiple filters)
    // cần Global Secondary Indexes (GSI) hoặc Scan (kém hiệu quả với bảng lớn)
    // Hiện tại, chúng ta sẽ dùng Scan và lọc trong code JS cho đơn giản ban đầu.
    // Bạn đã có GSI cho name, category, brand trong template.yaml,
    // nhưng để dùng chúng cần query() hoặc batchGet() thay vì scan()

    // Scan toàn bộ bảng (KHÔNG hiệu quả cho bảng lớn)
    const result = await dynamoDb.scan(params).promise();
    let products = result.Items;

    // Lọc trong code JavaScript
    if (query.isDeleted === false || query.isDeleted === undefined) {
      products = products.filter((p) => !p.isDeleted);
    } else if (query.isDeleted === true) {
      products = products.filter((p) => p.isDeleted);
    }

    if (query.name && query.name.$regex) {
      const keyword = query.name.$regex;
      const options = query.name.$options || "i";
      products = products.filter((p) => {
        const name = p.name || "";
        const nameNoSign = removeVietnameseTones(name).toLowerCase();
        const keywordNoSign = removeVietnameseTones(keyword).toLowerCase();
        // So sánh có dấu (regex) hoặc không dấu (includes)
        return (
          name.match(new RegExp(keyword, options)) ||
          nameNoSign.includes(keywordNoSign)
        );
      });
    }

    if (query.category) {
      products = products.filter((p) => p.category === query.category);
    }

    if (query.brand) {
      products = products.filter((p) => p.brand === query.brand);
    }

    if (query.price) {
      if (query.price.$gte !== undefined) {
        products = products.filter((p) => p.price >= query.price.$gte);
      }
      if (query.price.$lte !== undefined) {
        products = products.filter((p) => p.price <= query.price.$lte);
      }
    }

    // Sắp xếp trong code JavaScript
    if (options.sort) {
      const sortKey = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortKey]; // 1 for asc, -1 for desc

      products.sort((a, b) => {
        if (a[sortKey] < b[sortKey]) return sortOrder === 1 ? -1 : 1;
        if (a[sortKey] > b[sortKey]) return sortOrder === 1 ? 1 : -1;
        return 0;
      });
    }

    // Phân trang trong code JavaScript
    const pageSize = options.limit || 10;
    const page = options.skip ? options.skip / pageSize + 1 : 1;
    const startIndex = options.skip || 0;
    const endIndex = Math.min(startIndex + pageSize, products.length);

    return {
      products: products
        .slice(startIndex, endIndex)
        .map((item) => new Product(item)),
      count: products.length,
    };
  }

  // Phương thức kiểm tra sản phẩm còn hàng
  isInStock() {
    return this.countInStock > 0;
  }

  // Phương thức kiểm tra sản phẩm đã bị xóa mềm
  isDeletedProduct() {
    return this.isDeleted;
  }

  // Phương thức giảm số lượng khi đặt hàng
  decreaseStock(quantity) {
    if (this.countInStock >= quantity) {
      this.countInStock -= quantity;
      return true;
    }
    return false;
  }

  // Static method to update a product
  static async updateProduct(id, updateData) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error("Không tìm thấy sản phẩm");
    }
    let imagesArr = Array.isArray(updateData.images)
      ? updateData.images
      : typeof updateData.images === "string" && updateData.images
      ? updateData.images
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      : updateData.image
      ? [updateData.image]
      : product.images || [];
    let mainImage = imagesArr[0] || updateData.image || product.image || "";
    updateData.images = imagesArr;
    updateData.image = mainImage;
    let updateExpression = "set ";
    let expressionAttributeValues = {};
    let expressionAttributeNames = {};
    let hasUpdate = false;
    for (const key in updateData) {
      if (updateData.hasOwnProperty(key) && updateData[key] !== undefined) {
        updateExpression += `#${key} = :${key}, `;
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updateData[key];
        hasUpdate = true;
      }
    }
    if (!hasUpdate) {
      return product; // No updates provided
    }
    updateExpression += "updatedAt = :updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();
    updateExpression = updateExpression.endsWith(", ")
      ? updateExpression.slice(0, -2)
      : updateExpression;
    const params = {
      TableName: TABLE_NAME,
      Key: {
        id: id,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    };
    if (Object.keys(expressionAttributeNames).length > 0) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }
    const result = await dynamoDb.update(params).promise();
    return new Product(result.Attributes);
  }

  static async updateCountInStock(id, change) {
    console.log(
      "[ProductModel] updateCountInStock called with id:",
      id,
      "change:",
      change
    );
    const product = await Product.findById(id);
    if (!product) throw new Error("Không tìm thấy sản phẩm");
    product.countInStock += change;
    if (product.countInStock < 0) product.countInStock = 0;
    await product.save();
    return product;
  }

  // Static method để xóa mềm sản phẩm
  static async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error("Không tìm thấy sản phẩm");
    }
    if (product.isDeleted) {
      throw new Error("Sản phẩm đã bị xóa trước đó");
    }
    // Cập nhật trường isDeleted và deletedAt
    const params = {
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression:
        "set isDeleted = :isDeleted, deletedAt = :deletedAt, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":isDeleted": true,
        ":deletedAt": new Date().toISOString(),
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };
    const result = await dynamoDb.update(params).promise();
    return new Product(result.Attributes);
  }
}

module.exports = Product;
