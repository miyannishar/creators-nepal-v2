# Creators Nepal

<div align="center">
  <img src="https://www.patron.com/og.png" alt="Creators Nepal - Platform for Nepali Creators" width="600">
  
  [![GitHub](https://img.shields.io/badge/GitHub-CreatorsNepal-181717?style=flat&logo=github)](https://github.com/creatorsnepal)
  [![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=flat&logo=discord)](https://discord.gg/creatorsnepal)
</div>

**A platform designed specifically for Nepali creators to monetize their content, build communities, and connect with supporters through local payment solutions like eSewa and Khalti.**

Creators Nepal empowers Nepali creators by providing a platform tailored to the local creative economy. Whether you're an artist, writer, musician, content creator, or educator, you can share your work, engage with your audience, and build sustainable income through local payment gateways. No need for international payment processors or complex setups.

## Project Structure

This repository contains the following main applications and components:

- **`/clients/react-server`** - Full web application including landing page, authentication, and creator/supporter dashboards built with [React](https://react.dev/) and [Vite](https://vite.dev/)
- **`/supabase`** - Database migrations and Supabase configuration

> **Note**: This project uses [Supabase](https://supabase.com) for backend infrastructure, providing authentication, database, storage, and serverless functions.

## Features

- **Local Payment Solutions**: Seamlessly receive payments through eSewa and Khalti - Nepal's most trusted payment gateways. No need for international payment processors.

- **Build Your Community**: Connect with supporters, share exclusive content, and build lasting relationships with your audience. Create posts, engage with followers, and grow your creative community.

- **Made for Nepal**: Built specifically for Nepali creators with local language support, cultural understanding, and features tailored to the Nepali creative economy.

- **Creator Dashboard**: Professional tools to manage your content, track your growth, engage with your audience, and monitor your earnings.

- **Supporter Dashboard**: Discover new creators, follow your favorites, support them directly, and engage with exclusive content.

## Quick Start

```bash
# 1. Create a Supabase project at supabase.com

# 2. Set up the database
cd creators-nepal-v2
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# 3. Configure the frontend
cd clients/react-server
cp env-template.txt .env.local
# Edit .env.local with your Supabase credentials

# 4. Install and run
npm install
npm run dev
```

Visit `http://localhost:5173` to see your app! 🎉

## Technology Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Authentication**: Supabase Auth with Google OAuth and Email/Password
- **Payments**: eSewa & Khalti integration (coming soon)
- **UI**: Radix UI + Tailwind CSS
- **Real-time**: Supabase Realtime
- **Database**: PostgreSQL with Row Level Security (RLS)

## How It Works

1. **Create Your Profile**: Sign up and create your creator profile. Add your bio, social links, and showcase your work. Set up your page in minutes and start sharing your creative journey.

2. **Share Your Content**: Publish posts, share updates, and connect with your audience. Whether you're an artist, writer, musician, or content creator, share what you love with your community.

3. **Accept Support**: Enable supporters to support you directly through eSewa and Khalti. Receive payments instantly and build sustainable income from your creative work.

4. **Grow Your Community**: Build a loyal following, engage with supporters, and grow your creative business. Track your growth with analytics and insights designed for Nepali creators.

## Key Files to Keep

- **LICENSE** - Apache License 2.0 (important for open source)
- **commitlint.config.js** - Enforces conventional commit messages for clean git history
- **All files in `/clients/react-server/`** - The main application
- **All files in `/supabase/`** - Database migrations and configuration

## Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes Creators Nepal better for everyone.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ for Nepal's creative community</p>
  <p>© 2024 CreatorsNepal</p>
</div>
