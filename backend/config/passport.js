const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Debug biến môi trường
console.log("Google Client ID:", process.env.GOOGLE_CLIENT_ID);
console.log(
  "Google Client Secret:",
  process.env.GOOGLE_CLIENT_SECRET ? "✓ Exists" : "✗ Missing"
);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("API_BASE_URL:", process.env.API_BASE_URL);

const callbackURL =
  process.env.NODE_ENV === "production"
    ? `${process.env.API_BASE_URL}/api/users/auth/google/callback`
    : "/api/users/auth/google/callback";
console.log("Google OAuth Callback URL:", callbackURL);

console.log("Environment variables loaded:", Object.keys(process.env).length);

// Thay YOUR_GOOGLE_CLIENT_ID và YOUR_GOOGLE_CLIENT_SECRET bằng thông tin từ Google Developer Console
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Lấy email từ profile Google
        const email =
          profile.emails && profile.emails[0] ? profile.emails[0].value : "";

        if (!email) {
          return done(
            new Error("Email không tồn tại trong tài khoản Google"),
            null
          );
        }

        console.log("=== GOOGLE AUTH PROCESS ===");
        console.log("Google Profile ID:", profile.id);
        console.log("Email from Google:", email);
        console.log("Google Display Name:", profile.displayName);
        console.log("Google Profile:", JSON.stringify(profile, null, 2));

        // TÌM USER THEO GOOGLE ID - MỖI GOOGLE ACCOUNT CHỈ CÓ 1 USER
        console.log("� Searching for user with Google ID:", profile.id);
        let existingUser = await User.findByGoogleId(profile.id);
        console.log("User found by Google ID:", existingUser ? "YES" : "NO");

        if (existingUser) {
          console.log("✅ Found existing user for this Google account:", {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            googleId: existingUser.googleId,
          });
          console.log("🔄 Using existing user - no need to create new one");
          return done(null, existingUser);
        }

        console.log("🆕 No user found for this Google ID - creating new user");

        // Nếu user không tồn tại, tạo user mới
        const firstName = profile.name.givenName || "";
        const lastName = profile.name.familyName || "";
        const avatar =
          profile.photos && profile.photos[0] ? profile.photos[0].value : "";

        console.log("=== CREATING NEW GOOGLE USER ===");
        console.log("Google ID:", profile.id);
        console.log("Email:", email);
        console.log("First Name:", firstName);
        console.log("Last Name:", lastName);
        console.log("Avatar:", avatar);

        try {
          const newUser = await User.create({
            googleId: profile.id,
            email: email, // Sử dụng email gốc từ Google
            firstName: firstName,
            lastName: lastName,
            avatar: avatar,
            password: "", // Không cần password khi đăng nhập bằng Google
            isAdmin: false,
          });

          console.log("✅ New user created successfully:", {
            id: newUser.id,
            email: newUser.email,
            isAdmin: newUser.isAdmin,
          });
          console.log("===============================");

          return done(null, newUser);
        } catch (createError) {
          console.error("❌ ERROR creating new user:", createError);
          console.error("Error details:", {
            message: createError.message,
            code: createError.code,
            statusCode: createError.statusCode,
            stack: createError.stack,
          });
          return done(createError, null);
        }
      } catch (error) {
        console.error("Error in Google authentication:", error);
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("🔒 Serializing user:", { id: user.id, email: user.email });
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("🔓 ===== DESERIALIZING USER =====");
    console.log("🔓 Looking for user ID:", id);

    const user = await User.findById(id);
    if (user) {
      console.log("🔓 ✅ Found user:", {
        id: user.id,
        email: user.email,
        googleId: user.googleId,
      });
    } else {
      console.log("🔓 ❌ User not found for ID:", id);
    }

    console.log("🔓 ===============================");
    done(null, user);
  } catch (error) {
    console.error("🔓 Deserialize error:", error);
    done(error, null);
  }
});

module.exports = passport;
