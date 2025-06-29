const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const slugify = require("slugify");

// Configure AWS DynamoDB
AWS.config.update({ region: process.env.AWS_REGION || "ap-southeast-1" }); // Set your desired AWS region
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const CATEGORIES_TABLE_NAME =
  process.env.CATEGORIES_TABLE_NAME || "ShopCategories"; // Lấy tên bảng từ biến môi trường hoặc dùng mặc định

// Helper function to create a slug
const createSlug = (name) => {
  return slugify(name, {
    lower: true,
    strict: true,
    locale: "vi",
    trim: true,
  });
};

class Category {
  constructor({
    id,
    name,
    description,
    slug,
    image,
    isActive,
    isDeleted,
    deletedAt,
    order,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.slug = slug;
    this.image = image;
    this.isActive = isActive !== undefined ? isActive : true;
    this.isDeleted = isDeleted !== undefined ? isDeleted : false;
    this.deletedAt = deletedAt;
    this.order = order !== undefined ? order : 0;
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
      TableName: CATEGORIES_TABLE_NAME,
      Item: { ...this },
    };

    await dynamoDb.put(params).promise();
    return this;
  }

  static async create(categoryData) {
    const newCategory = new Category({
      ...categoryData,
      id: uuidv4(),
      slug: createSlug(categoryData.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Check if category with same name or slug already exists (including soft-deleted ones)
    const existingCategories = await dynamoDb
      .scan({
        TableName: CATEGORIES_TABLE_NAME,
        FilterExpression: "#n = :nameValue OR #s = :slugValue",
        ExpressionAttributeNames: {
          "#n": "name",
          "#s": "slug",
        },
        ExpressionAttributeValues: {
          ":nameValue": categoryData.name,
          ":slugValue": newCategory.slug,
        },
      })
      .promise();

    if (existingCategories.Items && existingCategories.Items.length > 0) {
      const nameMatch = existingCategories.Items.find(
        (item) => item.name.toLowerCase() === categoryData.name.toLowerCase()
      );
      if (nameMatch) {
        throw new Error("Danh mục đã tồn tại");
      }
      const slugMatch = existingCategories.Items.find(
        (item) => item.slug === newCategory.slug
      );
      if (slugMatch) {
        throw new Error("Slug đã tồn tại, vui lòng chọn tên khác");
      }
    }

    await newCategory.save();
    return newCategory;
  }

  static async find(query = {}, options = {}) {
    const { showDeleted, sort, name, slug } = query;

    let filterExpressions = [];
    let expressionAttributeValues = {};
    let expressionAttributeNames = {};

    if (!showDeleted) {
      filterExpressions.push(
        "attribute_not_exists(isDeleted) OR isDeleted = :isDeletedFalse"
      );
      expressionAttributeValues[":isDeletedFalse"] = false;
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
      TableName: CATEGORIES_TABLE_NAME,
    };

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(" AND ");
      params.ExpressionAttributeValues = expressionAttributeValues;
      if (Object.keys(expressionAttributeNames).length > 0) {
        params.ExpressionAttributeNames = expressionAttributeNames;
      }
    }

    const result = await dynamoDb.scan(params).promise();
    let categories = result.Items.map((item) => new Category(item));

    // Manual sorting for DynamoDB scan results
    if (sort) {
      switch (sort) {
        case "name_asc":
          categories.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "name_desc":
          categories.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case "newest":
          categories.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
        case "oldest":
          categories.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          break;
      }
    } else {
      categories.sort((a, b) => a.order - b.order); // Default sort by order
    }

    return categories;
  }

  static async findById(id) {
    const params = {
      TableName: CATEGORIES_TABLE_NAME,
      Key: {
        id: id,
      },
    };

    const result = await dynamoDb.get(params).promise();
    const category = result.Item;

    if (!category || category.isDeleted) {
      return null; // Don't return soft-deleted categories
    }

    return new Category(category);
  }

  static async findOne(query = {}) {
    const { name, slug, _id } = query;

    if (name) {
      const params = {
        TableName: CATEGORIES_TABLE_NAME,
        IndexName: "CategoryNameIndex", // Assuming you have a GSI on name
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
        const activeCategories = result.Items.filter((item) => !item.isDeleted);
        return activeCategories.length > 0
          ? new Category(activeCategories[0])
          : null;
      }
    } else if (slug) {
      const params = {
        TableName: CATEGORIES_TABLE_NAME,
        IndexName: "CategorySlugIndex", // Assuming you have a GSI on slug
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
        const activeCategories = result.Items.filter((item) => !item.isDeleted);
        return activeCategories.length > 0
          ? new Category(activeCategories[0])
          : null;
      }
    } else if (_id) {
      return await this.findById(_id);
    }

    // Fallback scan if no specific index is used or for other complex queries
    const result = await dynamoDb
      .scan({ TableName: CATEGORIES_TABLE_NAME })
      .promise();
    let categories = result.Items.map((item) => new Category(item));

    if (query.isDeleted !== undefined) {
      categories = categories.filter((c) => c.isDeleted === query.isDeleted);
    } else {
      categories = categories.filter((c) => !c.isDeleted);
    }

    if (name) categories = categories.filter((c) => c.name === name);
    if (slug) categories = categories.filter((c) => c.slug === slug);

    return categories.length > 0 ? categories[0] : null;
  }

  static async updateCategory(id, updateData) {
    const category = await Category.findById(id);

    if (!category) {
      throw new Error("Không tìm thấy danh mục");
    }

    let updateExpression = "set ";
    let expressionAttributeValues = {};
    let expressionAttributeNames = {};
    let hasUpdate = false;

    // Handle name change and slug update
    if (updateData.name && updateData.name !== category.name) {
      const newSlug = createSlug(updateData.name);

      const existingCategories = await dynamoDb
        .scan({
          TableName: CATEGORIES_TABLE_NAME,
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

      if (existingCategories.Items && existingCategories.Items.length > 0) {
        const nameConflict = existingCategories.Items.find(
          (item) => item.name.toLowerCase() === updateData.name.toLowerCase()
        );
        if (nameConflict) {
          throw new Error("Tên danh mục đã tồn tại");
        }
        const slugConflict = existingCategories.Items.find(
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

    const fieldsToUpdate = ["description", "image", "order", "isActive"];
    fieldsToUpdate.forEach((field) => {
      if (updateData[field] !== undefined) {
        updateExpression += `${field} = :${field}, `;
        expressionAttributeValues[`:${field}`] = updateData[field];
        hasUpdate = true;
      }
    });

    if (!hasUpdate) {
      return category;
    }

    updateExpression += "updatedAt = :updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    const params = {
      TableName: CATEGORIES_TABLE_NAME,
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
    return new Category(result.Attributes);
  }

  static async deleteCategory(id) {
    const category = await Category.findById(id);

    if (!category) {
      throw new Error("Không tìm thấy danh mục");
    }

    if (category.isDeleted) {
      throw new Error("Danh mục đã bị xóa trước đó");
    }

    const params = {
      TableName: CATEGORIES_TABLE_NAME,
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
    return new Category(result.Attributes);
  }

  isActiveCategory() {
    return this.isActive;
  }

  isDeletedCategory() {
    return this.isDeleted;
  }
}

module.exports = Category;
