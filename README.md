# E-Shop Project

## Cài đặt

1. Cài đặt Node.js (phiên bản 14.x trở lên)
2. Clone hoặc tải project về
3. Mở terminal và chạy các lệnh sau:

```bash
# Cài đặt dependencies cho backend
cd backend
npm install

# Cài đặt dependencies cho frontend
cd ../frontend
npm install
```

## Chạy ứng dụng

1. Chạy backend:
```bash
cd backend
npm start
```

2. Chạy frontend:
```bash
cd frontend
npm start
```

## Cấu trúc thư mục

```
project/
├── backend/           # Backend code
│   ├── controllers/   # Controllers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   └── ...
├── frontend/          # Frontend code
│   ├── src/           # Source code
│   ├── public/        # Static files
│   └── ...
└── README.md          # This file
```

## Các công nghệ sử dụng
- Frontend: React, Material-UI
- Backend: Node.js, Express, MongoDB
- Authentication: JWT
- Payment: Momo