# Financial Noting Backend API

RESTful API backend for the Financial Noting expense tracking application.

## Features

- User authentication with JWT
- Expense CRUD operations
- Account management
- Analytics and reporting
- Input validation and error handling
- MongoDB integration

## Tech Stack

- **Node.js 18+** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Express Validator** for input validation

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Accounts
- `GET /api/accounts` - Get user accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Expenses
- `GET /api/expenses` - Get user expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/analytics` - Get expense analytics

## Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/financial_noting
JWT_SECRET=your_super_secure_jwt_secret_here
PORT=5000
NODE_ENV=development
```

## Deployment

### Render
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables

### Heroku
```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
git push heroku main
```

### Railway
```bash
railway login
railway new
railway add
railway deploy
```

## Testing

```bash
npm test
```

## License

ISC