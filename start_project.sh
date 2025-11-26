#!/bin/bash
# Define the absolute path to the project directory
PROJECT_DIR="/Users/macmini/Desktop/copy/Agent_110707_trae/content-factory-agent"

echo "========================================"
echo "Initializing Project Setup"
echo "Target Directory: $PROJECT_DIR"
echo "========================================"

# Navigate to the project directory
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    echo "Successfully entered project directory."
else
    echo "Error: Directory not found at $PROJECT_DIR"
    exit 1
fi

# Check for node and npm
if ! command -v node &> /dev/null; then
    echo "Error: node is not installed."
    exit 1
fi

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed."
fi

# Start the server
echo "Starting development server on port 3000..."
npm run dev
