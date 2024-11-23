# Cyber Framework

A hypermedia-driven web framework for Deno, leveraging HTMX, Alpine.js, and Deno KV for state management.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Adding New OAuth Providers](#adding-new-oauth-providers)
- [Using CSS and Components](#using-css-and-components)
- [Project Structure](#project-structure)
- [Development Guidelines](#development-guidelines)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Cyber Framework is a lightweight, hypermedia-driven web framework for building secure and scalable web applications using Deno. It emphasizes native TypeScript code, hypermedia patterns, and leverages Deno KV for data persistence and session management.

## Features

- **Deno Runtime**: Built with Deno 2.0.6, utilizing its native APIs and features.
- **Hypermedia-Driven**: Employs HTMX for dynamic updates without heavy client-side JavaScript.
- **Lightweight Interactivity**: Uses Alpine.js for minimal client-side scripting.
- **Secure Authentication**: Implements OAuth flows using Deno KV OAuth with PKCE for enhanced security.
- **State Management**: Manages sessions and data using Deno KV, a key-value store.
- **Modular Components**: Promotes code locality by co-locating related code (HTML, CSS, TS) within components.
- **Performance Optimized**: Focuses on minimal client-side JavaScript and optimized KV queries.

## Getting Started

### Prerequisites

- **Deno**: Install Deno 2.0.6 or later from [deno.land](https://deno.land/#installation).
- **Git**: Ensure Git is installed for version control.
- **OAuth Credentials**: Obtain client IDs and client secrets from OAuth providers like Google and GitHub.

### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/yourusername/cyberframework.git
   cd cyberframework
   ```

2. **Set Up Environment Variables**:

   Create a `.env` file in the root directory with the following content:

   ```dotenv:.env
   # Application Configuration

   # Application URL
   APP_URL=http://localhost:8000

   # GitHub OAuth Configuration
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Optional: Additional Environment Variables
   # DATABASE_URL=your_database_url
   # SESSION_SECRET=your_session_secret
   ```

   Replace `your_github_client_id`, `your_github_client_secret`, `your_google_client_id`, and `your_google_client_secret` with your actual credentials.

### Configuration

Ensure that the `deno.json` file includes the following tasks:

```json:deno.json
{
  "tasks": {
    "dev": "deno run --watch --allow-net --allow-read --allow-env server.ts",
    "start": "deno run --allow-net --allow-read --allow-env server.ts"
  }
}
```

## Running the Application

To start the development server with hot-reloading:

```bash
deno task dev
```

To start the application without watching for changes:

```bash
deno task start
```

The application will run on `http://localhost:8000` by default.

## Adding New OAuth Providers

To add a new OAuth provider, follow these steps:

1. **Create Provider Configuration**:

   In the `app/auth/providers/` directory, create a new file for your provider, e.g., `myprovider.ts`:

   ```typescript:app/auth/providers/myprovider.ts
   import { createOAuth2Client } from "@deno/kv-oauth";

   export const myProvider = createOAuth2Client({
     providerName: "myprovider",
     clientId: Deno.env.get("MYPROVIDER_CLIENT_ID") || "",
     clientSecret: Deno.env.get("MYPROVIDER_CLIENT_SECRET") || "",
     authorizationEndpointUri: "https://myprovider.com/oauth/authorize",
     tokenUri: "https://myprovider.com/oauth/token",
     redirectUri: `${Deno.env.get("APP_URL")}/auth/myprovider/callback`,
     scope: ["profile", "email"],
   });
   ```

2. **Update Environment Variables**:

   Add the new provider's credentials to your `.env` file:

   ```dotenv:.env
   # MyProvider OAuth Configuration
   MYPROVIDER_CLIENT_ID=your_myprovider_client_id
   MYPROVIDER_CLIENT_SECRET=your_myprovider_client_secret
   ```

3. **Load the Provider in `oauth.ts`**:

   Update `app/auth/oauth.ts` to import the new provider:

   ```typescript:app/auth/oauth.ts
   import "./providers/myprovider.ts";
   ```

4. **Update Routes**:

   Ensure your routing logic in `app/router.ts` can handle the new provider:

   ```typescript:app/router.ts
   // ... existing code ...

   if (segments[2] === 'myprovider') {
     if (segments[3] === 'signin') {
       return await signIn('myprovider', req);
     }
     if (segments[3] === 'callback') {
       return await handleCallback('myprovider', req);
     }
   }

   // ... existing code ...
   ```

5. **Register Redirect URI**:

   In your OAuth provider's developer console, register the redirect URI:

   ```
   http://localhost:8000/auth/myprovider/callback
   ```

## Using CSS and Components

### Components

All UI components are located in `app/components/`. Each component has its own directory, following the PascalCase naming convention.

#### Example: Counter Component

- **Path**: `app/components/Counter/Counter.ts`
- **Usage**:

  ```html
  <div hx-get="/api/v1/counter" hx-swap="outerHTML">
    <!-- Counter component will be injected here -->
  </div>
  ```

### CSS Styles

Component-specific styles are located within their respective component directories or in the global `app/styles/` directory.

#### Example: Cards CSS

- **Path**: `app/styles/components/cards.css`
- **Usage**:

  In your HTML files, include the stylesheet:

  ```html
  <link rel="stylesheet" href="/styles/components/cards.css">
  ```

#### Example: Buttons CSS

- **Path**: `app/styles/components/buttons.css`
- **Usage**:

  In your HTML files, include the stylesheet:

  ```html
  <link rel="stylesheet" href="/styles/components/buttons.css">
  ```

## Project Structure

```
/
├── app/
│   ├── auth/          # OAuth providers and authentication logic
│   │   ├── providers/ # OAuth provider configurations
│   │   │   ├── github.ts
│   │   │   ├── google.ts
│   │   │   └── myprovider.ts
│   │   ├── middleware.ts
│   │   └── session.ts
│   ├── pages/         # Page handlers
│   ├── api/           # API endpoints
│   ├── components/    # UI components
│   └── styles/        # CSS files
├── public/            # Static assets
├── views/             # HTML templates
│   └── home.html
├── deno.json          # Deno configuration file
├── .env               # Environment variables
└── server.ts          # Entry point
```

## Development Guidelines

- **Native Deno APIs**: Use Deno's standard library and features over third-party modules.
- **Co-located Code**: Keep HTML, CSS, and TypeScript files related to a component within the same directory.
- **Hypermedia Patterns**: Utilize HTMX for server-driven UI updates.
- **Lightweight Interactivity**: Use Alpine.js for client-side behavior when necessary.
- **TypeScript Strictness**: Ensure proper typing by enabling `strict` and `noImplicitAny` in your `deno.json` or `tsconfig.json`.
- **Semantic HTML**: Use semantic tags to improve accessibility and SEO.
- **Error Handling**: Include comprehensive error handling in your code.
- **Performance Optimization**: Minimize client-side JavaScript and optimize KV queries.
- **Naming Conventions**: Follow the project's naming conventions for files and components.
- **Code Documentation**: Write self-documenting code with clear naming and include comments where necessary.

## Contributing

Contributions are welcome! Please follow these guidelines:

- **Fork the Repository**: Make your changes in a new branch.
- **Write Clear Commit Messages**: Describe your changes thoroughly.
- **Ensure Code Quality**: Run linters and tests before submitting.
- **Pull Requests**: Submit your PR for review and be responsive to any feedback.

## License

This project is licensed under the MIT License.