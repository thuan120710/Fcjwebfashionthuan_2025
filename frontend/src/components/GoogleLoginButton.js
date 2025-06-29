import React from "react";
import { Button } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    // Redirect người dùng đến route đăng nhập Google của backend
    window.location.href =
      "https://jv1hrj85xc.execute-api.ap-southeast-1.amazonaws.com/Prod/api/auth/google";
  };

  return (
    <Button
      variant="outlined"
      color="primary"
      fullWidth
      startIcon={<GoogleIcon />}
      onClick={handleGoogleLogin}
      sx={{
        my: 1,
        py: 1.2,
        borderRadius: 2,
        textTransform: "none",
        fontSize: "1rem",
        fontWeight: 500,
        border: "1px solid #ddd",
        backgroundColor: "#fff",
        "&:hover": {
          backgroundColor: "#f5f5f5",
          borderColor: "#ccc",
        },
      }}
    >
      Đăng nhập với Google
    </Button>
  );
};

export default GoogleLoginButton;
