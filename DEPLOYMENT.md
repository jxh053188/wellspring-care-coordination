# Wellspring Care Coordination - Deployment Guide

## Environment Variables Setup

This application requires environment variables to be configured for deployment. Follow these steps:

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Configure Required Variables

Edit your `.env` file and set the following variables:

#### Required Variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key

#### Optional Variables (uncomment if needed):
- `OPENAI_API_KEY`: For AI features in Supabase Studio
- `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN`: For SMS authentication
- `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET`: For Apple OAuth
- `S3_HOST`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`: For S3 storage

### 3. Render Deployment

When deploying to Render:

1. **Connect your GitHub repository** to Render
2. **Set Build Command**: `npm install && npm run build`
3. **Set Start Command**: `npm run preview` (or use a static site deployment)
4. **Add Environment Variables** in Render's dashboard:
   - Go to your service settings
   - Add the environment variables from your `.env` file
   - Make sure to set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### 4. Production Considerations

- Never commit `.env` files to git (they're already in `.gitignore`)
- Use Render's environment variable interface for production secrets
- Consider using different Supabase projects for development and production
- Update your Supabase project's allowed origins to include your Render domain

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Fill in your development environment variables
4. Run `npm install`
5. Run `npm run dev`

## Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Security Notes

- The `.env` file contains sensitive information and should never be committed
- Always use environment variables for API keys and secrets
- Regularly rotate your API keys and tokens
- Use different credentials for development and production environments
