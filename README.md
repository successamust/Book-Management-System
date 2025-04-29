Here's an enhanced **README.md** that incorporates your live deployment and Postman documentation links, making it more comprehensive for users and contributors:

```markdown
# Book Management API

![API Status](https://img.shields.io/badge/status-live-brightgreen) 
![License](https://img.shields.io/badge/license-MIT-blue)

A RESTful API for managing books, users, borrowing operations, and fines in a library system. The API is already deployed and ready to use.

## 🔗 Live Links
- **Live API**: [https://book-management-system-api-6p5p.onrender.com](https://book-management-system-api-6p5p.onrender.com)
- **Postman Documentation**: [https://documenter.getpostman.com/view/43469598/2sB2j3BBWA](https://documenter.getpostman.com/view/43469598/2sB2j3BBWA)

## Features

- ✅ User authentication and authorization (JWT)
- 📚 CRUD operations for books
- 🔄 Borrowing and returning books
- 💰 Fine calculation and management
- 👥 User management (including admin roles)
- 📊 Comprehensive reporting

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST   | `/auth/register` | Register a new user | Public |
| POST   | `/auth/register-admin` | Register new admin | Admin |
| POST   | `/auth/login` | User login | Public |
| POST   | `/auth/forgot-password` | Request password reset | Public |
| PATCH  | `/auth/reset-password/:token` | Reset password | Public |

### User Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/users` | Get all users | Admin |
| GET    | `/users/:id` | Get user details | User/Admin |
| PATCH  | `/users/:id` | Update user | User/Admin |
| PATCH  | `/users/:id/change-password` | Change password | User/Admin |
| DELETE | `/users/:id` | Delete user | Admin |

### Book Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/books` | List all books | Public |
| GET    | `/books/:id` | Get book details | Public |
| POST   | `/books` | Add new book | Admin |
| PATCH  | `/books/:id` | Update book | Admin |
| DELETE | `/books/:id` | Delete book | Admin |

### Borrowing Operations
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST   | `/borrow/:bookId` | Borrow a book | User |
| POST   | `/return/:bookId` | Return a book | User |
| GET    | `/borrow/active` | List active borrowings | User |
| GET    | `/borrow/history` | User borrowing history | User |
| GET    | `/borrow/overdue` | List overdue books | Admin |

### Fine Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/fines` | List fines | User/Admin |
| POST   | `/fines/:id/pay` | Pay fine | User |
| GET    | `/fines/calculate` | Calculate fines (cron) | System |

## 🚀 Quick Start

1. **Using the Live API**:
   - Access the deployed API directly: [https://book-management-system-api-6p5p.onrender.com](https://book-management-system-api-6p5p.onrender.com)
   - Refer to the [Postman documentation](https://documenter.getpostman.com/view/43469598/2sB2j3BBWA) for examples

2. **Local Development**:
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/book-management-api.git
   cd book-management-api

   # Install dependencies
   npm install

   # Configure environment variables
   cp .env.example .env
   # Edit .env with your configuration

   # Run the server
   npm start
   ```

## Data Models

### User
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "password": "string (hashed)",
  "role": "enum(user,admin)",
  "fines": "number"
}
```

### Book
```json
{
  "id": "string",
  "title": "string",
  "author": "string",
  "ISBN": "string",
  "quantity": "number",
  "available": "number",
  "status": "enum(available,unavailable)"
}
```

### Borrowing Record
```json
{
  "id": "string",
  "userId": "string (ref:User)",
  "bookId": "string (ref:Book)",
  "borrowDate": "date",
  "dueDate": "date",
  "returnDate": "date",
  "status": "enum(active,returned,overdue)",
  "fineAmount": "number"
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | Yes |
| `PASSWORD_RESET_EXPIRES` | Password reset token expiration | Yes |

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```

