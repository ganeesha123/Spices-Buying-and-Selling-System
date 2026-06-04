# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project (e.g., "Spices App")

## Step 2: Create a Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0 Sandbox)
3. Select a cloud provider and region (choose closest to your location)
4. Name your cluster (e.g., "Cluster0")
5. Click "Create Cluster"

## Step 3: Create Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username/password (remember these!)
5. Set database user privileges to "Atlas admin" or "Read and write to any database"
6. Click "Add User"

## Step 4: Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0) for development
   - For production, add specific IP addresses
4. Click "Confirm"

## Step 5: Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string

## Step 6: Update Your .env File
Replace the MONGODB_URI in your `.env` file with your connection string:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/spices_db?retryWrites=true&w=majority
```

Replace:
- `<username>` with your database username
- `<password>` with your database password
- `cluster0.xxxxx.mongodb.net` with your actual cluster URL
- `spices_db` is your database name (you can keep this)

## Example:
```
MONGODB_URI=mongodb+srv://spicesuser:mypassword123@cluster0.abc123.mongodb.net/spices_db?retryWrites=true&w=majority
```

## Step 7: Test Connection
After updating your .env file:
1. Save the file
2. Restart your backend server
3. Run the seed script: `node seedSupport.js`

## Troubleshooting
- Make sure your IP is whitelisted in Network Access
- Double-check username/password in connection string
- Ensure no special characters in password that need URL encoding
- Check that your cluster is active (not paused)
