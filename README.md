# Multi Ventor Backend

This is the backend server for the Multi Ventor application, built with Node.js and Express.

## Project Structure

```
Backend/
├── config/         # Configuration files
├── controller/     # Route controllers
├── db/            # Database related files
├── middleware/    # Custom middleware
├── model/         # Database models
├── routes/        # API routes
├── scripts/       # Utility scripts
├── utils/         # Helper functions
├── server.js      # Main application file
└── multer.js      # File upload configuration
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (if using MongoDB as database)

## Installation

1. Clone the repository
2. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and add your environment variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Documentation

API documentation is available in the `postman_collection.json` file. Import this file into Postman to view and test the available endpoints.

## Features

- User authentication and authorization
- File upload handling
- RESTful API endpoints
- Middleware for request validation
- Database integration
- Error handling

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 