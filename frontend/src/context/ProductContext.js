import React, { createContext, useContext, useReducer } from "react";
import { getProducts, getProductById } from "../services/apiService";

const ProductContext = createContext();

const initialState = {
  products: [],
  product: null,
  loading: false,
  error: null,
  page: 1,
  pages: 1,
  totalProducts: 0,
};

const productReducer = (state, action) => {
  switch (action.type) {
    case "PRODUCT_LIST_REQUEST":
      return { ...state, loading: true, error: null };
    case "PRODUCT_LIST_SUCCESS":
      return {
        ...state,
        loading: false,
        products: action.payload.products,
        page: action.payload.page,
        pages: action.payload.pages,
        totalProducts: action.payload.totalProducts,
      };
    case "PRODUCT_LIST_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "PRODUCT_DETAILS_REQUEST":
      return { ...state, loading: true, error: null };
    case "PRODUCT_DETAILS_SUCCESS":
      return { ...state, loading: false, product: action.payload };
    case "PRODUCT_DETAILS_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
};

export const ProductProvider = ({ children }) => {
  const [state, dispatch] = useReducer(productReducer, initialState);

  const fetchProducts = async (
    keyword = "",
    page = 1,
    category = "",
    brand = "",
    sort = ""
  ) => {
    try {
      dispatch({ type: "PRODUCT_LIST_REQUEST" });
      const { data } = await getProducts({
        keyword,
        page,
        category,
        brand,
        sort,
      });
      dispatch({
        type: "PRODUCT_LIST_SUCCESS",
        payload: {
          products: data.products,
          page: data.page,
          pages: data.pages,
          totalProducts: data.totalProducts,
        },
      });
    } catch (error) {
      dispatch({
        type: "PRODUCT_LIST_FAIL",
        payload:
          error.response?.data?.message || "Không thể tải danh sách sản phẩm",
      });
    }
  };

  const fetchProductDetails = async (id) => {
    try {
      dispatch({ type: "PRODUCT_DETAILS_REQUEST" });
      const { data } = await getProductById(id);
      dispatch({ type: "PRODUCT_DETAILS_SUCCESS", payload: data });
    } catch (error) {
      dispatch({
        type: "PRODUCT_DETAILS_FAIL",
        payload:
          error.response?.data?.message || "Không thể tải thông tin sản phẩm",
      });
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  return (
    <ProductContext.Provider
      value={{
        ...state,
        fetchProducts,
        fetchProductDetails,
        clearError,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProduct must be used within a ProductProvider");
  }
  return context;
};
