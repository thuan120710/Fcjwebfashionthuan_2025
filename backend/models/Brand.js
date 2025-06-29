const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const slugify = require("slugify");

// Configure AWS DynamoDB
AWS.config.update({ region: process.env.AWS_REGION || "ap-southeast-1" }); // Set your desired AWS region
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const BRANDS_TABLE_NAME = process.env.BRANDS_TABLE_NAME || "ShopBrands"; // Lấy tên bảng từ biến môi trường hoặc dùng mặc định

class Brand {
  constructor({
    id,
    name,
    description,
    slug,
    logo,
    website,
    isActive,
    featured,
    country,
    isDeleted,
    deletedAt,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.slug = slug;
    this.logo = logo;
    this.website = website;
    this.isActive = isActive !== undefined ? isActive : true;
    this.featured = featured !== undefined ? featured : false;
    this.country = country;
    this.isDeleted = isDeleted !== undefined ? isDeleted : false;
    this.deletedAt = deletedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  async save() {
    if (!this.id) {
      this.id = uuidv4();
      this.createdAt = new Date().toISOString();
    }
    this.updatedAt = new Date().toISOString();

    const params = {
      TableName: BRANDS_TABLE_NAME,
      Item: { ...this },
    };

    await dynamoDb.put(params).promise();
    return this;
  }

  static async create(brandData) {
    const newBrand = new Brand({
      ...brandData,
      id: uuidv4(),
      slug: Brand.createSlug(brandData.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Check if brand with same name or slug already exists (including soft-deleted ones)
    const existingBrands = await dynamoDb
      .scan({
        TableName: BRANDS_TABLE_NAME,
        FilterExpression: "#n = :nameValue OR #s = :slugValue",
        ExpressionAttributeNames: {
          "#n": "name",
          "#s": "slug",
        },
        ExpressionAttributeValues: {
          ":nameValue": brandData.name,
          ":slugValue": newBrand.slug,
        },
      })
      .promise();

    if (existingBrands.Items && existingBrands.Items.length > 0) {
      const nameMatch = existingBrands.Items.find(
        (item) => item.name.toLowerCase() === brandData.name.toLowerCase()
      );
      if (nameMatch) {
        throw new Error("Thương hiệu đã tồn tại");
      }
      const slugMatch = existingBrands.Items.find(
        (item) => item.slug === newBrand.slug
      );
      if (slugMatch) {
        throw new Error("Slug đã tồn tại, vui lòng chọn tên khác");
      }
    }

    await newBrand.save();
    return newBrand;
  }

  static async find(query = {}, options = {}) {
    const { showDeleted, sort, featured, name, slug } = query;

    let filterExpressions = [];
    let expressionAttributeValues = {};
    let expressionAttributeNames = {};

    if (!showDeleted) {
      filterExpressions.push(
        "attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse"
      );
      expressionAttributeValues[":isDeletedFalse"] = false;
    }

    if (featured === "true") {
      filterExpressions.push("featured = :featuredTrue");
      expressionAttributeValues[":featuredTrue"] = true;
    }

    if (name) {
      filterExpressions.push("contains(#n, :nameVal)");
      expressionAttributeNames["#n"] = "name";
      expressionAttributeValues[":nameVal"] = name; // For partial match or use GSI for exact match
    }

    if (slug) {
      filterExpressions.push("#s = :slugVal");
      expressionAttributeNames["#s"] = "slug";
      expressionAttributeValues[":slugVal"] = slug;
    }

    const params = {
      TableName: BRANDS_TABLE_NAME,
    };

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(" AND ");
      params.ExpressionAttributeValues = expressionAttributeValues;
      if (Object.keys(expressionAttributeNames).length > 0) {
        params.ExpressionAttributeNames = expressionAttributeNames;
      }
    }

    const result = await dynamoDb.scan(params).promise();
    let brands = result.Items.map((item) => new Brand(item));

    // Manual sorting for DynamoDB scan results
    if (sort) {
      switch (sort) {
        case "name_asc":
          brands.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "name_desc":
          brands.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case "newest":
          brands.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case "oldest":
          brands.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case "featured":
          // Sort by featured (true first), then by name
          brands.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return a.name.localeCompare(b.name);
          });
          break;
      }
    }

    return brands;
  }

  static async findById(id) {
    const params = {
      TableName: BRANDS_TABLE_NAME,
      Key: {
        id: id,
      },
    };

    const result = await dynamoDb.get(params).promise();
    const brand = result.Item;

    if (!brand || brand.isDeleted) {
      return null; // Don't return soft-deleted brands
    }

    return new Brand(brand);
  }

  static async findOne(query = {}) {
    // This is a simplified findOne, assuming query will often be by name or slug
    // For more complex queries, you might need to use GSI or scan and filter
    const { name, slug } = query;

    if (name) {
      const params = {
        TableName: BRANDS_TABLE_NAME,
        IndexName: "BrandNameIndex", // Assuming you have a GSI on name
        KeyConditionExpression: "#n = :name",
        ExpressionAttributeNames: {
          "#n": "name",
        },
        ExpressionAttributeValues: {
          ":name": name,
        },
      };
      const result = await dynamoDb.query(params).promise();
      if (result.Items && result.Items.length > 0) {
        const activeBrands = result.Items.filter((item) => !item.isDeleted);
        return activeBrands.length > 0 ? new Brand(activeBrands[0]) : null;
      }
    } else if (slug) {
      const params = {
        TableName: BRANDS_TABLE_NAME,
        IndexName: "BrandSlugIndex", // Assuming you have a GSI on slug
        KeyConditionExpression: "#s = :slug",
        ExpressionAttributeNames: {
          "#s": "slug",
        },
        ExpressionAttributeValues: {
          ":slug": slug,
        },
      };
      const result = await dynamoDb.query(params).promise();
      if (result.Items && result.Items.length > 0) {
        const activeBrands = result.Items.filter((item) => !item.isDeleted);
        return activeBrands.length > 0 ? new Brand(activeBrands[0]) : null;
      }
    } else if (query._id) {
      // For _id, assuming it maps to 'id' in DynamoDB
      return await this.findById(query._id);
    }

    // Fallback scan if no specific index is used or for other complex queries
    const result = await dynamoDb
      .scan({ TableName: BRANDS_TABLE_NAME })
      .promise();
    let brands = result.Items.map((item) => new Brand(item));

    // Apply other filters from query if any
    if (query.isDeleted !== undefined) {
      brands = brands.filter((b) => b.isDeleted === query.isDeleted);
    } else {
      brands = brands.filter((b) => !b.isDeleted);
    }

    if (name) brands = brands.filter((b) => b.name === name);
    if (slug) brands = brands.filter((b) => b.slug === slug);

    return brands.length > 0 ? brands[0] : null;
  }

  static async updateBrand(id, updateData) {
    const brand = await Brand.findById(id); // Use findById to get an active brand

    if (!brand) {
      throw new Error("Không tìm thấy thương hiệu");
    }

    let updateExpression = "set ";
    let expressionAttributeValues = {};
    let expressionAttributeNames = {};
    let hasUpdate = false;

    // Handle name change and slug update
    if (updateData.name && updateData.name !== brand.name) {
      const newSlug = Brand.createSlug(updateData.name);

      // Check if the new name or slug already exists for another brand (excluding current one)
      const existingBrands = await dynamoDb
        .scan({
          TableName: BRANDS_TABLE_NAME,
          FilterExpression:
            "id <> :id AND (attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse) AND ( #n = :newName OR #s = :newSlug)",
          ExpressionAttributeNames: {
            "#n": "name",
            "#s": "slug",
          },
          ExpressionAttributeValues: {
            ":id": id,
            ":isDeletedFalse": false,
            ":newName": updateData.name,
            ":newSlug": newSlug,
          },
        })
        .promise();

      if (existingBrands.Items && existingBrands.Items.length > 0) {
        const nameConflict = existingBrands.Items.find(
          (item) => item.name.toLowerCase() === updateData.name.toLowerCase()
        );
        if (nameConflict) {
          throw new Error("Tên thương hiệu đã tồn tại");
        }
        const slugConflict = existingBrands.Items.find(
          (item) => item.slug === newSlug
        );
        if (slugConflict) {
          throw new Error("Slug đã tồn tại, vui lòng chọn tên khác");
        }
      }

      updateExpression += "#nameAttr = :name, #slugAttr = :slug, ";
      expressionAttributeValues[":name"] = updateData.name;
      expressionAttributeValues[":slug"] = newSlug;
      expressionAttributeNames["#nameAttr"] = "name";
      expressionAttributeNames["#slugAttr"] = "slug";
      hasUpdate = true;
    }

    const fieldsToUpdate = [
      "description",
      "logo",
      "website",
      "country",
      "featured",
      "isActive",
    ];
    fieldsToUpdate.forEach((field) => {
      // Only update if the value is explicitly provided in updateData
      if (updateData[field] !== undefined) {
        updateExpression += `${field} = :${field}, `;
        expressionAttributeValues[`:${field}`] = updateData[field];
        hasUpdate = true;
      }
    });

    if (!hasUpdate) {
      return brand; // No updates provided
    }

    updateExpression += "updatedAt = :updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    const params = {
      TableName: BRANDS_TABLE_NAME,
      Key: {
        id: id,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW", // Return the updated item
    };

    if (Object.keys(expressionAttributeNames).length > 0) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }

    const result = await dynamoDb.update(params).promise();
    return new Brand(result.Attributes);
  }

  static async deleteBrand(id) {
    const brand = await Brand.findById(id); // Use findById to get an active brand

    if (!brand) {
      throw new Error("Không tìm thấy thương hiệu");
    }

    if (brand.isDeleted) {
      throw new Error("Thương hiệu đã bị xóa trước đó");
    }

    const params = {
      TableName: BRANDS_TABLE_NAME,
      Key: {
        id: id,
      },
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
    return new Brand(result.Attributes);
  }

  // Method to check if brand is featured (instance method, like Mongoose)
  isFeatured() {
    return this.featured;
  }

  // Method to check if brand is soft-deleted (instance method)
  isDeletedBrand() {
    return this.isDeleted;
  }

  static createSlug(name) {
    return slugify(name, {
      lower: true,
      strict: true,
      locale: "vi",
      trim: true,
    });
  }
}

module.exports = Brand;
