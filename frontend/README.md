# Orbital AMM Frontend

Modern frontend interface for the Orbital AMM protocol using spherical geometry for optimal capital efficiency.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization
- **Three.js** - 3D orbital visualizations

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Features

- **Token Swapping** - Instant trades with minimal slippage
- **Liquidity Management** - Add/remove positions with efficiency tracking
- **Analytics Dashboard** - Real-time pool statistics and charts
- **3D Visualization** - Interactive orbital mechanics simulation

## Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── SwapInterface.tsx
│   ├── LiquidityInterface.tsx
│   └── AnalyticsDashboard.tsx
└── lib/                  # Utilities and math functions
```

## Development

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code linting
npm run type-check   # TypeScript validation
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
