# NodeGoat System Architecture

## 1. Application

The selected open-source application is OWASP NodeGoat.

NodeGoat is an intentionally vulnerable web application developed using
Node.js and Express.js with MongoDB as its database.

## 2. Main Components

### User / Web Browser
The user accesses the NodeGoat application using a web browser.

### NodeGoat Web Application
- Technology: Node.js and Express.js
- Runs inside a Docker container
- Service name: web
- Application port: 4000

### MongoDB Database
- Database technology: MongoDB
- Runs inside a separate Docker container
- Service name: mongo
- Port: 27017
- Database name: nodegoat

## 3. Data Flow

User / Browser
→ HTTP request on port 4000
→ NodeGoat Web Application
→ MongoDB connection on port 27017
→ MongoDB Database

The response returns from MongoDB through the NodeGoat application
to the user's browser.

## 4. Trust Boundaries

### Trust Boundary 1
Between the external user/browser and the NodeGoat web application.

### Trust Boundary 2
Between the NodeGoat application and the MongoDB database.

These trust boundaries will be considered during STRIDE threat modelling.