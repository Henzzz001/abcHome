# abcHome

A research-focused school management system built with Next.js and Supabase. This project is designed as a prototype for academic and experimental use, with a focus on managing school operations in a modular, role-based environment.

It provides a foundation for student information management, attendance tracking, department/organization administration, and role-aware access for different users within an educational institution.

## Overview

abcHome aims to simplify common school administration tasks through a web application that supports:

- Student record management
- Administrative workflows
- Role-based dashboard access
- Attendance tracking and scanner-based entry
- Department and organization management
- Supabase-powered authentication and data storage

This repository is intentionally structured as a research project and academic prototype, making it a useful base for further extension, experimentation, and feature development.

## Why this project exists

The system was developed as a school management platform for research purposes, with an emphasis on studying:

- Educational workflow automation
- Role-based access patterns in academic systems
- Student management interfaces
- Attendance processing and operational tracking
- Modern web application patterns using Next.js and Supabase

## Key Features

### Student Management
- Create and manage student profiles
- Track student identification details
- Associate students with departments, courses, and year levels
- Support administrative student workflows

### Role-Based Access
- Admin access
- Teacher dashboard
- Student dashboard
- Parent dashboard
- Staff dashboard

### Attendance and Tracking
- Attendance-related actions and workflows
- Scanner-enabled attendance workflows
- Data-driven tracking for operational processes

### Organization and Department Support
- Department and organization modules
- Administrative structure management
- Flexible foundation for expanding school-specific features

### Modern Tech Stack
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase for authentication and database services

## Tech Stack

- Frontend: Next.js, React, TypeScript
- Styling: Tailwind CSS
- Backend/Auth/Data: Supabase
- Runtime: Node.js
- Deployment target: Vercel-ready

## Project Structure

```bash
abcHome/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── admin/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── actions/
│   ├── components/
│   ├── features/
│   └── lib/
├── public/
├── supabase/
├── .gitignore
├── eslint.config.mjs
├── middleware.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── README.md
└── package-lock.json
```

## Getting Started

### Prerequisites

Before running the project, make sure you have:

- Node.js 20+
- npm or pnpm
- A Supabase project
- Access to environment variables for local development

### Installation

1. Clone the repository

```bash
git clone https://github.com/Henzzz001/abcHome.git
cd abcHome
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

Create a `.env.local` file in the root directory and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

If your setup requires additional configuration for auth or database connections, match the environment variables expected by the project’s Supabase client utilities.

### Run the development server

```bash
npm run dev
```

Then open:

```bash
http://localhost:3000
```

## Available Scripts

```bash
npm run dev     # start development server
npm run build   # production build
npm run start   # start production server
npm run lint    # run ESLint checks
```

## Database and Authentication

This project uses Supabase for:

- Authentication
- User role management
- Profile storage
- Data persistence for student and administrative records

The app is structured around role-driven access, which makes it suitable for exploring academic workflow scenarios and user-permission design patterns.

## Research Use

This project is intended for educational and research contexts. It can be extended for:

- Prototype testing
- Academic demonstrations
- Workflow studies
- Role-management experiments
- Feature exploration in school systems

## Future Development Ideas

Potential extensions for this project include:

- Attendance analytics dashboards
- Student grade and performance tracking
- Parent communication portals
- Notifications and messaging systems
- Exam and timetable modules
- Financial and fee management
- Reports and export features
- Multi-school or multi-campus support

## Contributing

Contributions are welcome, especially for research-oriented enhancements and prototype improvements.

If you want to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Open a pull request with a clear explanation of the improvement

## Notes

This repository is best viewed as a research prototype rather than a fully production-ready school enterprise system. It provides a strong starting point for extension, learning, and experimentation in modern web application development.

## Contact

For questions or collaboration opportunities, contact the repository owner via GitHub.

---

Built for research, learning, and experimentation in school management systems.
