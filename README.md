# Project Setup

## Prerequisites
Before running the project, ensure you have a `secrets` folder in the root directory containing two files for MongoDB credentials.

### Step 1: Create `secrets` Folder and Files
1. In the root of your project, create a new folder named `secrets`.
2. Inside the `secrets` folder, create two files:
   - `mongodb_username.txt`
   - `mongodb_password.txt`

### Step 2: Add Your Credentials
Add your MongoDB credentials to these files without any spaces or additional characters:
- `mongodb_username.txt` should contain only the MongoDB username.
- `mongodb_password.txt` should contain only the MongoDB password.

## Running the Application
To build and start the application, use the following command:

```
docker-compose up --build
```

Once the application is running, you can access it at [http://localhost:3000](http://localhost:3000).

## Additional Information
- Ensure Docker is installed and running on your system.
- The application is configured to connect to MongoDB using the credentials provided in the `secrets` folder.
``` 
