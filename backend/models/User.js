const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid"); // Add uuid for generating IDs

// Cấu hình AWS SDK cho region của bạn
AWS.config.update({ region: process.env.AWS_REGION || "ap-southeast-1" });

// Tạo DynamoDB DocumentClient
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.USERS_TABLE_NAME || "ShopUsers"; // Lấy tên bảng từ biến môi trường

class User {
  constructor({
    id,
    username,
    email,
    password,
    firstName,
    lastName,
    isAdmin,
    googleId,
    avatar,
    isDeleted,
    deletedAt,
    resetPasswordToken,
    resetPasswordExpires,
    createdAt,
    updatedAt,
    phone,
    address,
  }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password; // hashed password
    this.firstName = firstName;
    this.lastName = lastName;
    this.isAdmin = isAdmin !== undefined ? isAdmin : false;
    this.googleId = googleId;
    this.avatar = avatar !== undefined ? avatar : "";
    this.isDeleted = isDeleted !== undefined ? isDeleted : false;
    this.deletedAt = deletedAt;
    this.resetPasswordToken = resetPasswordToken;
    this.resetPasswordExpires = resetPasswordExpires;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
    this.phone = phone || "";
    this.address = address || "";
  }

  // Phương thức để lưu user mới vào DynamoDB (đã hash password trước đó)
  async save() {
    console.log("💾 Saving user to DynamoDB...");

    if (!this.id) {
      this.id = uuidv4(); // Tạo ID duy nhất nếu chưa có
      console.log("💾 Generated new ID:", this.id);
    }
    // Update updatedAt timestamp
    this.updatedAt = new Date().toISOString();

    const params = {
      TableName: TABLE_NAME,
      Item: { ...this },
    };

    console.log("💾 DynamoDB put params:", JSON.stringify(params, null, 2));

    try {
      await dynamoDb.put(params).promise();
      console.log("✅ User saved successfully to DynamoDB");
      return this;
    } catch (error) {
      console.error("❌ Error saving user to DynamoDB:", error);
      throw error;
    }
  }

  // Phương thức so sánh mật khẩu
  async matchPassword(enteredPassword) {
    if (!this.password) return false; // Không có mật khẩu để so sánh
    return await bcrypt.compare(enteredPassword, this.password);
  }

  // Static method để tìm user bằng email
  static async findByEmail(email) {
    const params = {
      TableName: TABLE_NAME,
      IndexName: "EmailIndex", // Tên GSI bạn đã định nghĩa trong template.yaml
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    };

    const result = await dynamoDb.query(params).promise();
    if (result.Items && result.Items.length > 0) {
      // Lọc các user chưa bị xóa mềm
      const activeUsers = result.Items.filter((user) => !user.isDeleted);
      if (activeUsers.length > 0) {
        return new User(activeUsers[0]);
      }
    }
    return null;
  }

  // Static method để tìm user bằng ID
  static async findById(id) {
    const params = {
      TableName: TABLE_NAME,
      Key: { id: id },
    };

    const result = await dynamoDb.get(params).promise();
    if (result.Item && !result.Item.isDeleted) {
      return new User(result.Item);
    }
    return null;
  }

  // Static method để tìm user bằng Google ID
  static async findByGoogleId(googleId) {
    console.log("🔍 Searching for user with Google ID:", googleId);

    const params = {
      TableName: TABLE_NAME,
      FilterExpression:
        "googleId = :googleId AND (attribute_not_exists(isDeleted) OR isDeleted = :isDeleted)",
      ExpressionAttributeValues: {
        ":googleId": googleId,
        ":isDeleted": false,
      },
    };

    console.log("🔍 DynamoDB scan params:", JSON.stringify(params, null, 2));

    try {
      const result = await dynamoDb.scan(params).promise();
      console.log("🔍 DynamoDB scan result:", {
        Count: result.Count,
        ScannedCount: result.ScannedCount,
        Items: result.Items ? result.Items.length : 0,
      });

      if (result.Items && result.Items.length > 0) {
        console.log("✅ Found user with Google ID:", result.Items[0]);
        return new User(result.Items[0]);
      }

      console.log("❌ No user found with Google ID:", googleId);
      return null;
    } catch (error) {
      console.error("❌ Error searching for user by Google ID:", error);
      throw error;
    }
  }

  // Static method để tạo user mới (dùng cho Google OAuth)
  static async create(userData) {
    console.log("🆕 Creating new user with data:", userData);

    const user = new User({
      id: uuidv4(),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log("🆕 User object created:", {
      id: user.id,
      email: user.email,
      googleId: user.googleId,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    try {
      const savedUser = await user.save();
      console.log("✅ User saved successfully to DynamoDB:", {
        id: savedUser.id,
        email: savedUser.email,
        googleId: savedUser.googleId,
      });
      return savedUser;
    } catch (error) {
      console.error("❌ Error saving user to DynamoDB:", error);
      throw error;
    }
  }

  // Static method để hash password (dùng trong controller khi tạo/cập nhật user)
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // Static method để lấy danh sách tất cả người dùng với tùy chọn lọc
  static async find(query = {}) {
    const { showDeleted } = query;
    const params = {
      TableName: TABLE_NAME,
    };

    const result = await dynamoDb.scan(params).promise();
    let users = result.Items;

    if (!showDeleted || showDeleted.toLowerCase() !== "true") {
      users = users.filter((user) => !user.isDeleted);
    }

    return users.map((item) => new User(item));
  }

  // Static method để cập nhật người dùng
  static async updateUser(id, updateData) {
    const user = await User.findById(id); // Lấy user hiện tại

    if (!user) {
      throw new Error("Không tìm thấy người dùng");
    }

    console.log("updateUser called with:", updateData);

    let updateExpression = "set ";
    let expressionAttributeValues = {};
    let expressionAttributeNames = {};
    let hasUpdate = false;

    for (const key in updateData) {
      if (updateData.hasOwnProperty(key)) {
        let value = updateData[key];

        // Handle password hashing if provided
        if (key === "password" && value) {
          value = await User.hashPassword(value);
        }

        // Handle null values to remove attributes
        if (value === null) {
          updateExpression += `#${key} = :${key}, `;
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = null;
        } else if (value !== undefined) {
          // Only update if value is explicitly provided
          updateExpression += `#${key} = :${key}, `;
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = value;
        }
        hasUpdate = true;
      }
    }

    if (!hasUpdate) {
      return user; // No updates provided
    }

    // Always update updatedAt timestamp
    updateExpression += "updatedAt = :updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    // Remove trailing comma if any
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

    console.log("DynamoDB update params:", JSON.stringify(params, null, 2));

    const result = await dynamoDb.update(params).promise();
    return new User(result.Attributes);
  }

  // Static method để xóa mềm người dùng
  static async deleteUser(id) {
    const user = await User.findById(id);

    if (!user) {
      throw new Error("Không tìm thấy người dùng");
    }

    // Prevent deleting already soft-deleted user
    if (user.isDeleted) {
      throw new Error("Người dùng đã bị xóa trước đó");
    }

    const params = {
      TableName: TABLE_NAME,
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
    return new User(result.Attributes);
  }

  // Static method để tìm user bằng reset password token và kiểm tra thời hạn
  static async findByResetToken(token) {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression:
        "resetPasswordToken = :token AND resetPasswordExpires > :now",
      ExpressionAttributeValues: {
        ":token": token,
        ":now": new Date().toISOString(), // Compare against ISO string
      },
    };

    const result = await dynamoDb.scan(params).promise();
    if (result.Items && result.Items.length > 0) {
      return new User(result.Items[0]);
    }
    return null;
  }

  // Static method để lấy tên đầy đủ
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Static method để kiểm tra quyền admin
  isAdminUser() {
    return this.isAdmin;
  }

  // Static method để kiểm tra tài khoản đã bị xóa mềm
  isDeletedUser() {
    return this.isDeleted;
  }
}

module.exports = User;
