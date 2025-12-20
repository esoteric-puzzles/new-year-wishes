#!/bin/bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix nvm)/nvm.sh" ] && . "$(brew --prefix nvm)/nvm.sh"

# Use Node version from .nvmrc
nvm install
nvm use

# Install system dependencies (needed for canvas)
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Install npm dependencies
npm install

# Install Angular CLI globally
npm install -g @angular/cli

echo "✅ Setup complete!"
