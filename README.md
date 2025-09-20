# social-security-tools

Website Source for <https://ssa.tools/>.

The code here builds what is statically served at that site.

## Development Setup

This project requires Node.js 22.19.0+ or 20.19+. We recommend using NVM to
manage Node.js versions.

### Quick Setup

```sh
# Clone the repository
git clone https://github.com/Gregable/social-security-tools.git
cd social-security-tools

# Run the setup script (installs Node.js, dependencies, and runs quality checks)
npm run setup
```

### Manual Setup

1. **Install Node.js** (if not using the setup script):

   ```sh
   # Using NVM (recommended)
   nvm install
   nvm use

   # Or install Node.js 22.19.0+ manually
   ```

2. **Install dependencies**:

   ```sh
   npm install --legacy-peer-deps
   ```

3. **Start development server**:

   ```sh
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run quality` - Run formatting, linting, and type checking
- `npm run storybook` - Start Storybook for component development

## Docker

The website can be run locally as a Docker container. Run the latest image from
Docker Hub:

```sh
docker run -p 4173:4173 gregable/ssa-tools:latest
```

Then load <https://localhost:4173/> in your browser.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Gregable/social-security-tools&type=Date)](https://star-history.com/#Gregable/social-security-tools&Date)
