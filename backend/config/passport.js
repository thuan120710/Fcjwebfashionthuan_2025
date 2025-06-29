const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Debug biến môi trường
console.log("Google Client ID:", process.env.GOOGLE_CLIENT_ID);
console.log(
  "Google Client Secret:",
  process.env.GOOGLE_CLIENT_SECRET ? "✓ Exists" : "✗ Missing"
);
console.log("Environment variables loaded:", Object.keys(process.env).length);

// Thay YOUR_GOOGLE_CLIENT_ID và YOUR_GOOGLE_CLIENT_SECRET bằng thông tin từ Google Developer Console
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/users/auth/google/callback",
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

        // Kiểm tra xem user đã tồn tại trong database chưa (theo googleId hoặc email)
        let existingUser = await User.findOne({ googleId: profile.id });

        // Nếu không tìm thấy theo googleId, tìm kiếm theo email
        if (!existingUser) {
          existingUser = await User.findOne({ email: email });

          // Nếu tìm thấy user với email này, cập nhật googleId cho user đó
          if (existingUser) {
            existingUser.googleId = profile.id;
            existingUser.avatar =
              profile.photos && profile.photos[0]
                ? profile.photos[0].value
                : existingUser.avatar;
            await existingUser.save();
            console.log("Đã cập nhật GoogleId cho user:", email);
          }
        }

        if (existingUser) {
          return done(null, existingUser);
        }

        // Nếu user không tồn tại, tạo user mới
        const firstName = profile.name.givenName || "";
        const lastName = profile.name.familyName || "";
        const avatar =
          profile.photos && profile.photos[0] ? profile.photos[0].value : "";

        const newUser = await User.create({
          googleId: profile.id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          avatar: avatar,
          password: "", // Không cần password khi đăng nhập bằng Google
          isAdmin: false,
        });

        done(null, newUser);
      } catch (error) {
        console.error("Error in Google authentication:", error);
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
