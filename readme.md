# AI Chatbot with Next.js and Ollama

A modern chatbot interface built with Next.js, React, and integrated with Ollama's phi3:mini model. Features a clean, responsive UI similar to ChatGPT and Claude.
This website is meant to set-up and runned on AWS or any cloud service provider.

## Features

- Real-time chat interface
- Integration with Ollama API
- Responsive design
- Message history
- Loading states and animations
- Error handling
- Markdown support

## Tech Stack

- Frontend: Next.js 15.1.6 with TypeScript
- UI: React 19.0.0 with Tailwind CSS
- Icons: Lucide React
- Backend API Integration: Ollama Service (ECS with Fargate)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Ollama service running and accessible

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chatbot-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```
NEXT_PUBLIC_API_URL=http://[Your-ECS-IP]:11434
```

## Running the Application

1. Development mode:
```bash
npm run dev
```
Access the application at `http://localhost:3000`

2. Production build:
```bash
npm run build
npm start
```

## API Configuration

The chatbot integrates with Ollama running on ECS. Configure the API endpoint in these locations:

1. `.env.local`:
```
NEXT_PUBLIC_API_URL=http://[Your-ECS-IP]:11434
```

2. Security Group Configuration:
- WebServer Security Group
- Ollama-ecs Security Group
- Ensure inbound traffic rules are properly configured

## API Endpoints

Setup .env.local file to include your necessary endpoints for connection within any cloud infrastructure.

## Environment Setup

1. Create a `.env.local` file in the root directory with the following variables: 
A sample .env file is show below.

```bash
# PostgreSQL Connection
POSTGRES_HOST=your-database-endpoint.region.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=your_database_name
POSTGRES_USER=your_database_username
POSTGRES_PASSWORD=your_database_password

# JWT Secret (generate a strong random string i.e. openssl rand -hex 64)
JWT_SECRET=your_jwt_secret_key_here

# Ollama API Configuration
NEXT_PUBLIC_API_URL=http://your-ollama-server:11434
```

The application uses the following Ollama endpoints:

1. Model Check:
```bash
curl http://[ECS-IP]:11434/api/pull -d '{"name": "phi3:mini"}'
```

2. Generate Response:
```bash
curl -X POST http://[ECS-IP]:11434/api/generate -d '{
  "model": "phi3:mini",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx               # Root layout
│   ├── auth/
│   │   ├── page.tsx            # Main chat interface
│   │   └── redirect/
│   │       └── page.tsx        # Auth redirect handler
│   ├── globals.css             # Global styles
│   ├── components/
│   │   └── SidePanel.tsx       # Side panel component
│   └── api/
│       ├── auth/
│       │   ├── check/
│       │   │   └── route.ts    # Auth check endpoint
│       │   ├── login/
│       │   │   └── route.ts    # Login endpoint
│       │   ├── logout/
│       │   │   └── route.ts    # Logout endpoint
│       │   └── signup/
│       │       └── route.ts    # Signup endpoint
│       ├── chat/
│       │   └── route.ts        # Chat API endpoint
│       └── chats/
│           └── route.ts        # Chats management endpoint
└── utils/
    └── db.ts      # Database Connection
```

## Security Considerations

1. API Security:
   - Ensure proper security group configurations
   - Limit inbound traffic to necessary ports
   - Configure CORS policies appropriately

2. Environment Variables:
   - Never commit `.env` files
   - Use proper environment variable handling
   - Follow security best practices for API keys

## Troubleshooting

1. API Connection Issues:
   - Verify ECS IP address is correct
   - Check security group configurations
   - Ensure Ollama service is running

2. Build Errors:
   - Ensure all dependencies are installed
   - Check for correct Node.js version
   - Verify TypeScript configurations

## License

[GNU GENERAL PUBLIC LICENSE]
