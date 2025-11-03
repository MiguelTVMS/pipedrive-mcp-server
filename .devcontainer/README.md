# Development Container Setup

This repository includes a devcontainer configuration for consistent development environments using VS Code's Remote - Containers extension.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## Environment Variables

Before opening the project in a devcontainer, ensure you have the following environment variables set on your local machine:

### Required

- `PIPEDRIVE_API_TOKEN` - Your Pipedrive API token
- `PIPEDRIVE_DOMAIN` - Your Pipedrive domain (e.g., 'company.pipedrive.com')

### Optional (for JWT authentication)

- `MCP_JWT_SECRET` - Secret key for JWT token verification
- `MCP_JWT_ALGORITHM` - Algorithm for JWT (default: HS256)
- `MCP_JWT_AUDIENCE` - Expected audience claim
- `MCP_JWT_ISSUER` - Expected issuer claim

## Getting Started

1. **Set environment variables** on your local machine
   - Windows: System Properties → Environment Variables
   - macOS/Linux: Add to `~/.bashrc`, `~/.zshrc`, or `~/.profile`

2. **Open in devcontainer**
   - Open this folder in VS Code
   - Press `F1` and select "Dev Containers: Reopen in Container"
   - Or click the notification prompt to reopen in container

3. **Wait for setup**
   - The container will build and install dependencies automatically
   - This may take a few minutes on first launch

4. **Start developing**

   ```bash
   npm run dev    # Run in development mode
   npm run build  # Build the project
   npm start      # Run production build
   ```

## Features Included

- **Node.js 20**: Latest LTS version
- **TypeScript**: Full TypeScript support
- **Docker-in-Docker**: Build and run containers from within the devcontainer
- **Pre-installed extensions**:
  - ESLint
  - Prettier
  - TypeScript support
  - Docker extension
  - Error Lens
  - Code Spell Checker

## Port Forwarding

Port 3000 is automatically forwarded for the MCP server.

## Troubleshooting

### Environment variables not available

Make sure the variables are set in your **local** environment before opening the devcontainer. The devcontainer configuration will pass them through.

### Permission issues

The container runs as the `node` user (non-root) for security.

### Container won't start

- Ensure Docker Desktop is running
- Try rebuilding the container: `F1` → "Dev Containers: Rebuild Container"
