# AMAN SOLUTION

AMAN SOLUTION is a multi-platform application consisting of a mobile client, backend API, and admin dashboard.

## Project Structure

```text
aman-solution/
├── mobile/     # Flutter mobile application
├── backend/    # Node.js + TypeScript Express backend with Prisma ORM
├── admin/      # Admin dashboard application
└── README.md   # Project documentation
```

## Backend Getting Started

### 1. Navigate to the backend folder

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` in `.env` with your Neon PostgreSQL connection string.

### 4. Run the development server

```bash
npm run dev
```

### 5. Check the backend health

Open this URL in your browser:

```text
http://localhost:5000/health
```

## Next.js Development

If you're working on the Next.js application, run the development server from its project directory:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You can start editing the application by modifying `app/page.tsx`. The page updates automatically when you save your changes.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn](https://nextjs.org/learn)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Flutter Documentation](https://docs.flutter.dev)

## Deployment

The Next.js application can be deployed using [Vercel](https://vercel.com/).

For more information, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).