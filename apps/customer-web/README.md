# Vishwaneed customer web

Customer-facing React application for the Vishwaneed multi-vendor marketplace. The app uses a typed API boundary and can run against a development-only local adapter while the backend is being implemented.

## Run locally

From the repository root:

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` when you need to override the defaults.

```dotenv
VITE_API_MODE=mock
VITE_API_URL=/api/v1
```

- `VITE_API_MODE=mock` uses local catalogue, account, cart, address, quote, and COD-order responses. The UI always identifies this mode.
- `VITE_API_MODE=http` uses the centralized HTTP adapter and `VITE_API_URL`. Do not place secrets in Vite environment variables.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Backend integration

The frontend contract is in `src/api/types.ts`; live endpoint mapping is in `src/api/httpMarketplaceApi.ts`. Backend-calculated checkout quotes remain authoritative for product totals, GST-inclusive prices, vendor shipping, stock, and the final payable amount. Prepaid checkout stays disabled in mock mode until payment creation and verification are available.
