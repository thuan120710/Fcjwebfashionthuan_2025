import React, { createContext, useContext, useReducer, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const CartContext = createContext();

const cartReducer = (state, action) => {
  try {
    switch (action.type) {
      case "ADD_TO_CART":
        const existingItem = state.items.find(
          (item) => item.productId === action.payload.productId
        );
        if (existingItem) {
          return {
            ...state,
            items: state.items.map((item) =>
              item.productId === action.payload.productId
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    price: action.payload.price || item.price,
                    name: action.payload.name || item.name,
                    image: action.payload.image || item.image,
                  }
                : item
            ),
          };
        }
        return {
          ...state,
          items: [
            ...state.items,
            {
              ...action.payload,
              quantity: 1,
              price: action.payload.price,
              name: action.payload.name,
              image: action.payload.image,
            },
          ],
        };

      case "REMOVE_FROM_CART":
        return {
          ...state,
          items: state.items.filter(
            (item) => item.productId !== action.payload
          ),
        };

      case "UPDATE_QUANTITY":
        return {
          ...state,
          items: state.items.map((item) =>
            item.productId === action.payload.productId
              ? { ...item, quantity: action.payload.quantity }
              : item
          ),
        };

      case "SET_COUPON":
        return {
          ...state,
          appliedCoupon: action.payload,
        };

      case "REMOVE_COUPON":
        return {
          ...state,
          appliedCoupon: null,
        };

      case "SET_SHIPPING_COUPON":
        return {
          ...state,
          appliedShippingCoupon: action.payload,
        };

      case "REMOVE_SHIPPING_COUPON":
        return {
          ...state,
          appliedShippingCoupon: null,
        };

      case "CLEAR_CART":
        return {
          ...state,
          items: [],
          appliedCoupon: null,
          appliedShippingCoupon: null,
        };

      case "LOAD_CART":
        return {
          ...state,
          items: action.payload || [],
        };

      default:
        return state;
    }
  } catch (error) {
    console.error("Error in cartReducer:", error);
    return state;
  }
};

// Custom toast options
const toastOptions = {
  icon: <CheckCircleIcon fontSize="small" />,
  className: "custom-toast",
};

const API_BASE_URL = process.env.REACT_APP_API_URL;

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    appliedCoupon: null,
    appliedShippingCoupon: null,
  });

  useEffect(() => {
    const loadCart = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo) return;

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.get(`${API_BASE_URL}/api/cart`, config);
        if (data && data.items) {
          dispatch({ type: "LOAD_CART", payload: data.items });
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        toast.error("Lỗi tải giỏ hàng", { autoClose: 2000 });
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(state.items));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
      toast.error("Lỗi lưu giỏ hàng", { autoClose: 2000 });
    }
  }, [state.items]);

  const addToCart = async (product) => {
    try {
      if (!product || (!product.id && !product.productId)) {
        throw new Error("Invalid product data");
      }

      // Lấy id đúng (ưu tiên productId, fallback id)
      const productId = product.productId || product.id;
      // Lấy số lượng đã có trong giỏ hàng
      const existingItem = state.items.find(
        (item) => item.productId === productId
      );
      const currentQty = existingItem ? existingItem.quantity : 0;
      const addQty = product.quantity || 1;
      // Số lượng tồn kho thực tế
      const stock = product.countInStock || product.stock || 0;
      if (currentQty + addQty > stock) {
        toast.error("Bạn đã thêm tối đa số lượng sản phẩm còn lại trong kho!", {
          autoClose: 2000,
        });
        return;
      }

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        `${API_BASE_URL}/api/cart`,
        {
          productId,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: addQty,
        },
        config
      );

      dispatch({ type: "LOAD_CART", payload: data.items });
      toast.success("Đã thêm vào giỏ", toastOptions);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Không thể thêm sản phẩm", { autoClose: 2000 });
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.delete(`${API_BASE_URL}/api/cart/${productId}`, config);
      dispatch({ type: "REMOVE_FROM_CART", payload: productId });
      toast.success("Đã xóa sản phẩm", toastOptions);
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Không thể xóa sản phẩm", { autoClose: 2000 });
    }
  };

  const updateQuantity = async (productIdOrObj, quantity) => {
    try {
      // Cho phép truyền vào productId hoặc object product
      let productId = productIdOrObj;
      if (typeof productIdOrObj === "object") {
        productId = productIdOrObj.productId || productIdOrObj.id;
      }
      if (!productId) {
        throw new Error("Product ID is required");
      }

      if (quantity < 1) {
        toast.error("Số lượng phải > 0", { autoClose: 2000 });
        return;
      }

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo) {
        toast.error("Vui lòng đăng nhập", { autoClose: 2000 });
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.put(
        `${API_BASE_URL}/api/cart/${productId}`,
        { quantity },
        config
      );

      if (data && data.items) {
        dispatch({ type: "LOAD_CART", payload: data.items });
        toast.success("Đã cập nhật số lượng", toastOptions);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error(
        error.response?.data?.message || "Không thể cập nhật số lượng",
        { autoClose: 2000 }
      );
    }
  };

  const clearCart = () => {
    try {
      dispatch({ type: "CLEAR_CART" });
      toast.success("Đã xóa giỏ hàng", toastOptions);
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Không thể xóa giỏ hàng", { autoClose: 2000 });
    }
  };

  const cartTotal = state.items.reduce((total, item) => {
    const price = item.price || (item.product && item.product.price) || 0;
    const quantity = item.quantity || 0;
    return total + price * quantity;
  }, 0);

  const applyCoupon = (coupon) => {
    dispatch({ type: "SET_COUPON", payload: coupon });
  };

  const removeCoupon = () => {
    dispatch({ type: "REMOVE_COUPON" });
  };

  const calculateDiscount = () => {
    if (!state.appliedCoupon) return 0;

    const subtotal = cartTotal;
    if (state.appliedCoupon.discountType === "percentage") {
      const discount = (subtotal * state.appliedCoupon.discountValue) / 100;
      return state.appliedCoupon.maximumDiscount
        ? Math.min(discount, state.appliedCoupon.maximumDiscount)
        : discount;
    }
    return state.appliedCoupon.discountValue;
  };

  const finalTotal = cartTotal - calculateDiscount();

  const applyShippingCoupon = (coupon) => {
    dispatch({ type: "SET_SHIPPING_COUPON", payload: coupon });
  };

  const removeShippingCoupon = () => {
    dispatch({ type: "REMOVE_SHIPPING_COUPON" });
  };

  const calculateShippingDiscount = (orderTotal) => {
    if (!state.appliedShippingCoupon) return 0;
    if (state.appliedShippingCoupon.discountType === "percentage") {
      const discount =
        (orderTotal * state.appliedShippingCoupon.discountValue) / 100;
      return state.appliedShippingCoupon.maximumDiscount
        ? Math.min(discount, state.appliedShippingCoupon.maximumDiscount)
        : discount;
    }
    return state.appliedShippingCoupon.discountValue;
  };

  const placeOrder = async (orderData) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };

      await axios.post(
        "https://qk0ka1pe68.execute-api.ap-southeast-1.amazonaws.com/Prod/api/orders",
        orderData,
        config
      );
      dispatch({ type: "CLEAR_CART" });

      toast.success("Đặt hàng thành công", toastOptions);
    } catch (error) {
      toast.error("Không thể đặt hàng", { autoClose: 2000 });
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        appliedCoupon: state.appliedCoupon,
        applyCoupon,
        removeCoupon,
        calculateDiscount,
        finalTotal,
        appliedShippingCoupon: state.appliedShippingCoupon,
        applyShippingCoupon,
        removeShippingCoupon,
        calculateShippingDiscount,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
