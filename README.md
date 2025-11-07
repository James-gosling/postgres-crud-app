# Postgres CRUD App

## Project Overview
This project is a CRUD (Create, Read, Update, Delete) application built using PostgreSQL. It demonstrates how to perform basic database operations efficiently using a RESTful API architecture.

## Architecture
The application follows the MVC (Model-View-Controller) pattern. The components are as follows:
- **Model**: Represents the data structure and database interactions.
- **View**: User interface that displays data and allows user interaction.
- **Controller**: Handles the logic and routes for incoming requests.

## Prerequisites
Before getting started, ensure you have the following installed:
- [PostgreSQL](https://www.postgresql.org/download/)  (version 13 or higher)
- [Node.js](https://nodejs.org/en/download/) (version 14 or higher)
- [npm](https://www.npmjs.com/get-npm) (comes with Node.js)

## Installation Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/James-gosling/postgres-crud-app.git
   cd postgres-crud-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   
3. **Setup the database**:
   - Create a new PostgreSQL database and user.
   - Update the database configuration in the `config.js` file.

4. **Run database migrations** (if applicable):
   ```bash
   npm run migrate
   ```

5. **Start the application**:
   ```bash
   npm start
   ```

## Usage Instructions
- The server will start on `http://localhost:3000`. You can use tools like Postman or Curl to interact with the API.
- Here are some example endpoints:
  - **Create a new record**: `POST /api/records`
  - **Read all records**: `GET /api/records`
  - **Update a record**: `PUT /api/records/:id`
  - **Delete a record**: `DELETE /api/records/:id`

## Technology Stack
- **Database**: PostgreSQL
- **Backend**: Node.js, Express
- **ORM**: Sequelize (or your preferred ORM)
- **Testing**: Jest (or your preferred testing framework)

## CRUD Operations Demonstration
1. **Create**: Send a `POST` request to create a new record.
2. **Read**: Send a `GET` request to retrieve records.
3. **Update**: Send a `PUT` request with the record's ID to update it.
4. **Delete**: Send a `DELETE` request with the record's ID to remove it.

## Data Persistence Verification
- After performing CRUD operations, verify the changes by checking the PostgreSQL database directly using a database client like pgAdmin or DBeaver.

## Troubleshooting Guide
- **Server not starting**: Check the logs for error messages and ensure the database configurations are correct.
- **Database connection issues**: Verify that the PostgreSQL server is running and the credentials in `config.js` are correct.
- **Deprecation warnings**: Ensure all packages are updated to their latest versions.

---
For further information, feel free to reach out with any questions or issues!