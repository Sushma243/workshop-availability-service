# Installing Node.js and npm

You need Node.js 18+ to run this project. Here are the installation options:

## Option 1: Install via Homebrew (Recommended for macOS)

If you have Homebrew installed:

```bash
brew install node@18
```

Or install the latest LTS version:

```bash
brew install node
```

If you don't have Homebrew, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Option 2: Download from nodejs.org

1. Visit https://nodejs.org/
2. Download the LTS version (18.x or higher) for macOS
3. Run the installer package (.pkg file)
4. Follow the installation wizard

## Option 3: Install via nvm (Node Version Manager)

This allows you to manage multiple Node.js versions:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal or run:
source ~/.zshrc

# Install Node.js 18
nvm install 18
nvm use 18
```

## Verify Installation

After installation, verify it works:

```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

## Then Install Project Dependencies

Once Node.js is installed, run:

```bash
cd /Users/sushmakudum/IdeaProjects/projects/workshop-availability-service
npm install
```
