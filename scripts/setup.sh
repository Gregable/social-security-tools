#!/bin/bash

# Setup script for SSA Tools development environment
echo "🔧 Setting up SSA Tools development environment..."

# Check if nvm is installed
if ! command -v nvm &> /dev/null; then
    echo "❌ NVM is not installed. Please install NVM first:"
    echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    exit 1
fi

# Use the Node.js version specified in .nvmrc
echo "📦 Installing and using Node.js version from .nvmrc..."
nvm install
nvm use

# Install dependencies
echo "📚 Installing dependencies..."
npm install --legacy-peer-deps

# Run quality checks
echo "✅ Running quality checks..."
npm run quality

echo "🎉 Setup complete! You can now run:"
echo "   npm run dev    - Start development server"
echo "   npm run build  - Build for production"
echo "   npm run test   - Run tests"
