const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const transporter = require("../config/nodemailer");
const AWS = require("aws-sdk");
const path = require("path");

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.AVATAR_BUCKET_NAME || "uploands-avatars-2025";

/**
 * @desc    Xác thực người dùng & lấy token
 * @route   POST /api/users/login
 * @access  Public
 */
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Tìm user theo email
  const user = await User.findByEmail(email);

  // Kiểm tra user tồn tại và mật khẩu đúng
  if (user && (await user.matchPassword(password))) {
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      token: generateToken(user.id),
    });
  } else {
    res.status(401);
    throw new Error("Email hoặc mật khẩu không đúng");
  }
});

/**
 * @desc    Đăng ký người dùng mới
 * @route   POST /api/users
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;

  // Validate input
  if (!username || !email || !password || !firstName || !lastName) {
    res.status(400);
    throw new Error("Vui lòng cung cấp đầy đủ thông tin");
  }

  // Kiểm tra email hợp lệ
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Email không hợp lệ");
  }

  // Kiểm tra độ dài mật khẩu
  if (password.length < 8) {
    res.status(400);
    throw new Error("Mật khẩu phải có ít nhất 8 ký tự");
  }

  try {
    // Kiểm tra user đã tồn tại chưa bằng email
    const userExistsByEmail = await User.findByEmail(email);
    if (userExistsByEmail) {
      res.status(400);
      throw new Error("Email đã được sử dụng");
    }

    // Hash mật khẩu trước khi lưu
    const hashedPassword = await User.hashPassword(password);

    // Tạo user mới (sử dụng class User của DynamoDB)
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    const user = await newUser.save();

    if (user) {
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        token: generateToken(user.id),
      });
    } else {
      res.status(400);
      throw new Error("Dữ liệu người dùng không hợp lệ");
    }
  } catch (error) {
    // Xử lý lỗi DynamoDB: email uniqueness đã được kiểm tra bằng findByEmail
    // Các lỗi khác sẽ được throw ra
    throw error;
  }
});

/**
 * @desc    Lấy thông tin người dùng
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  // req.user được set từ middleware protect
  const user = await User.findById(req.user.id);

  if (user) {
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
    });
  } else {
    res.status(404);
    throw new Error("Không tìm thấy người dùng");
  }
});

/**
 * @desc    Cập nhật thông tin người dùng
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    const updateData = {
      username: req.body.username || user.username,
      email: req.body.email || user.email,
      firstName: req.body.firstName || user.firstName,
      lastName: req.body.lastName || user.lastName,
      phone: req.body.phone || user.phone,
      address: req.body.address || user.address,
    };

    // Chỉ cập nhật password nếu được gửi lên
    if (req.body.password) {
      updateData.password = await User.hashPassword(req.body.password);
    }

    // Using static update method on User model
    const updatedUser = await User.updateUser(user.id, updateData);

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser.id),
      phone: updatedUser.phone,
      address: updatedUser.address,
    });
  } else {
    res.status(404);
    throw new Error("Không tìm thấy người dùng");
  }
});

/**
 * @desc    Lấy danh sách tất cả người dùng
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  // Kiểm tra quyền admin
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Không có quyền thực hiện hành động này");
  }

  // Lấy tham số query (showDeleted)
  const { showDeleted } = req.query;

  // Use static find method from User model
  const users = await User.find({ showDeleted });

  // Loại bỏ password trước khi gửi về client
  const usersWithoutPassword = users.map(({ password, ...rest }) => rest);

  res.json(usersWithoutPassword);
});

/**
 * @desc    Xóa mềm người dùng
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  // Kiểm tra quyền admin
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Không có quyền thực hiện hành động này");
  }

  // Ngăn chặn admin xóa chính mình
  if (req.params.id === req.user.id) {
    res.status(400);
    throw new Error("Không thể xóa tài khoản admin đang đăng nhập");
  }

  try {
    const deletedUser = await User.deleteUser(req.params.id); // Use static method deleteUser

    res.json({
      message: "Người dùng đã được xóa thành công",
      user: {
        id: deletedUser.id,
        username: deletedUser.username,
        email: deletedUser.email,
        deletedAt: deletedUser.deletedAt,
      },
    });
  } catch (error) {
    res.status(404);
    throw new Error(error.message);
  }
});

/**
 * @desc    Lấy thông tin người dùng theo ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id); // select -password is not needed for DynamoDB User model

  if (user) {
    // Ensure password is not sent back
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy người dùng");
  }
});

/**
 * @desc    Cập nhật người dùng bởi Admin
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { username, email, firstName, lastName, isAdmin, password } = req.body;

  try {
    const updatedUser = await User.updateUser(req.params.id, {
      username,
      email,
      firstName,
      lastName,
      isAdmin,
      password, // User model will handle hashing if provided
    });

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isAdmin: updatedUser.isAdmin,
    });
  } catch (error) {
    res.status(404);
    throw new Error(error.message);
  }
});

/**
 * @desc    Gửi email reset mật khẩu
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    res.status(404);
    throw new Error("Không tìm thấy người dùng với email này");
  }

  // Tạo token reset mật khẩu
  const resetToken = crypto.randomBytes(20).toString("hex");
  const resetExpires = Date.now() + 3600000; // 1 giờ

  // Update user with reset token and expiry using the static updateUser method
  const updatedUser = await User.updateUser(user.id, {
    resetPasswordToken: resetToken,
    resetPasswordExpires: new Date(resetExpires).toISOString(),
  });

  // Tạo link reset mật khẩu
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  // Gửi email với template đẹp hơn
  const mailOptions = {
    from: `"Web Bán Quần Áo" <${process.env.EMAIL_USER}>`,
    to: updatedUser.email,
    subject: "Yêu cầu đặt lại mật khẩu của bạn",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
  <!-- Header -->
  <div style="background-color: #2196f3; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h1 style="color: white; margin: 0;">Đặt Lại Mật Khẩu</h1>
  </div>

  <!-- Main Content -->
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-bottom: 20px;">Xin chào ${updatedUser.firstName} ${updatedUser.lastName},</h2>
    
    <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
    </p>

    <!-- Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="background-color: #2196f3; 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 5px;
                font-weight: bold;
                display: inline-block;
                transition: background-color 0.3s ease-in-out;">
        Đặt Lại Mật Khẩu
      </a>
    </div>

    <!-- Link Backup -->
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="color: #666; margin: 0 0 10px 0;">
        Nếu nút không hoạt động, bạn có thể copy và dán link sau vào trình duyệt:
      </p>
      <p style="word-break: break-all; margin: 0; color: #2196f3;">
        ${resetUrl}
      </p>
    </div>

    <!-- Warning -->
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="color: #856404; margin: 0;">
        <strong>Lưu ý:</strong><br>
        - Link này sẽ hết hạn sau 1 giờ<br>
        - Chỉ sử dụng một lần duy nhất
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
    <p style="margin-top: 10px;">
      © 2024 Web Bán Quần Áo. Tất cả các quyền được bảo lưu.
    </p>
  </div>
</div>

    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "Email đặt lại mật khẩu đã được gửi" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500);
    throw new Error("Không thể gửi email đặt lại mật khẩu");
  }
});

/**
 * @desc    Đặt lại mật khẩu
 * @route   POST /api/users/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Use a new static method to find user by reset token and check expiry
  const user = await User.findByResetToken(token);

  if (!user) {
    res.status(400);
    throw new Error("Token không hợp lệ hoặc đã hết hạn");
  }

  // Update user's password and clear reset token fields
  const updatedUser = await User.updateUser(user.id, {
    password: password, // The User model will hash this
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });

  res.json({ message: "Mật khẩu đã được đặt lại thành công" });
});

/**
 * @desc    Upload ảnh đại diện cho người dùng
 * @route   POST /api/users/profile/upload-avatar
 * @access  Private
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Vui lòng chọn ảnh để tải lên");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("Không tìm thấy người dùng");
  }

  // Tạo tên file duy nhất
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const fileExtension = path.extname(req.file.originalname);
  const fileName = `avatars/avatar-${uniqueSuffix}${fileExtension}`;

  // Chuẩn bị params để upload lên S3
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  try {
    // Upload file lên S3
    const { Location } = await s3.upload(params).promise();

    // Cập nhật đường dẫn avatar trong database
    await User.updateUser(user.id, { avatar: Location });
    const updatedUser = await User.findById(user.id);

    // Trả về thông tin user đã cập nhật
    res.json({
      message: "Tải ảnh lên thành công",
      avatar: updatedUser.avatar,
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isAdmin: updatedUser.isAdmin,
      phone: updatedUser.phone,
      address: updatedUser.address,
    });
  } catch (error) {
    console.error("S3 Upload Error:", error);
    res.status(500);
    throw new Error("Có lỗi xảy ra khi tải ảnh lên S3.");
  }
});

module.exports = {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  forgotPassword,
  resetPassword,
  uploadAvatar,
};
