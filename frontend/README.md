# RWA Tokenization Platform - Frontend

This is the frontend application for the Real-World Asset (RWA) Tokenization Platform built with Next.js 16, React 19, and TypeScript.

## Features

- 🔐 **Authentication**: User registration and login with JWT
- 📊 **Dashboard**: Overview of portfolio and market statistics
- 🏪 **Marketplace**: Browse and search tokenized assets
- 💰 **Trading**: Buy and sell asset tokens
- 📈 **Charts**: Real-time price history visualization
- 👛 **Portfolio**: Track your investments and transactions

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Core API server running (see `Api/core/README.md`)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Update the API URL in `.env.local` if needed:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard page
│   ├── marketplace/       # Asset marketplace
│   │   └── [id]/         # Asset detail page
│   ├── portfolio/        # User portfolio
│   ├── login/            # Login page
│   └── register/         # Registration page
├── components/            # React components
│   ├── ui/               # UI components (Button, Input, Card)
│   ├── layout/           # Layout components (Navbar)
│   ├── marketplace/      # Marketplace components
│   └── charts/           # Chart components
├── contexts/             # React contexts (Auth)
├── lib/                  # Utilities and API client
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Key Dependencies

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Axios** - HTTP client
- **Recharts** - Charts library
- **Lucide React** - Icons

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Core API base URL (default: http://localhost:5000/api)

## Notes

- The TypeScript errors for missing packages (axios, recharts, lucide-react) will be resolved once you run `npm install`
- Make sure the Core API server is running before starting the frontend
- Default demo wallet balance is $10,000 for new users
