# WorkHub - Mobile Project Management App

**WorkHub** is a modern, mobile-first project management application built with **React Native** and **Expo**.  
It enables teams to collaborate efficiently through organized teams, projects, and tasks — designed for fast-moving teams who need clarity, speed, and real-time visibility.

Made with love in **Lagos, Nigeria** 🇳🇬

## Features

- **Secure Authentication** — Sign up / Sign in using **Clerk** (email/password + Google OAuth)
- **Team Management** — Create teams, add/remove members, assign roles (admin/member), custom team colors
- **Project Organization** — Projects belong to specific teams, with full member access control (owner/editor/viewer)
- **Task Management** — Create, edit, assign, track tasks with statuses:
  - To Do / In Progress / Done
  - Priority levels (low / medium / high / urgent)
  - Due dates with overdue highlighting
  - Assignee management (from team members)
- **Real-time Dashboard** — Home screen shows personal workload summary:
  - Pending, In Work, Completed, Critical (overdue)
  - Active teams & recent projects
- **Search Everywhere** — Global search bar to quickly find teams, projects, or tasks
- **User Profile** — Avatar upload, name editing, notification preferences, security settings (change password, delete account)
- **Push Notifications** (planned) — Due date reminders to assignees
- **Dark Cyber Aesthetic** — Modern, dark, futuristic UI with gradients and smooth animations

## Tech Stack

| Layer              | Technology                            | Purpose                                      |
|--------------------|---------------------------------------|----------------------------------------------|
| Frontend           | React Native + Expo                   | Cross-platform mobile app (iOS & Android)    |
| Styling            | NativeWind (Tailwind CSS for RN)      | Rapid, consistent UI development             |
| Authentication     | Clerk                                 | Secure auth, social login, user management   |
| State Management   | React Context + Zustand (optional)    | Global refresh, user state                   |
| Navigation         | Expo Router                           | File-based routing                           |
| Backend            | Node.js + Express                     | RESTful API                                  |
| Database           | MongoDB (Mongoose)                    | Flexible document storage                    |
| Push Notifications | Expo Notifications + Expo Server SDK  | Due date reminders                           |
| Deployment         | Vercel (backend), EAS (mobile builds) | Fast, reliable hosting & CI/CD               |

## Project Structure

```
workhub/
├── app/                        # Expo Router file-based routing
│   ├── (auth)/                 # Authentication screens
│   ├── (root)/(tabs)/          # Main tab navigation
│   │   ├── index.tsx           # Home/Dashboard
│   │   ├── team/[teamId].tsx
│   │   ├── project/[projectId]/index.tsx
│   │   └── task/[taskId].tsx
│   ├── settings.tsx
│   ├── create-team.tsx
│   ├── create-project.tsx
│   └── create-task.tsx
├── components/                 # Reusable UI components
│   ├── SearchBar.tsx
│   └── SummaryCard.tsx
├── context/                    # Global contexts
│   └── RefreshContext.tsx
├── lib/
│   └── api.ts                  # Universal API client with auth
├── constants/
│   └── icons.ts
├── backend/                    # Node.js + Express server (separate repo or folder)
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── middleware/
└── app.json / eas.json         # Expo configuration
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- Yarn / npm / pnpm
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`) — for builds
- MongoDB instance (local or Atlas)
- Clerk account + project keys

### Frontend Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/workhub.git
cd workhub

# Install dependencies
yarn install

# Create .env file
cp .env.example .env
# Fill in:
# EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
# And other needed keys

# Start development server
npx expo start --clear
```

### Backend Setup (separate folder or repo)

```bash
cd backend
yarn install

# .env
cp .env.example .env
# Fill in:
# PORT=5000
# MONGODB_URI=mongodb+srv://...
# CLERK_SECRET_KEY=sk_...

yarn dev
```

### Development Build (required for push notifications)

```bash
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

Then install the build on your device.

## Scripts

```bash
yarn start       # Start Expo dev server
yarn android     # Run on Android emulator/device
yarn ios         # Run on iOS simulator/device
yarn build:dev   # Create development build
yarn build:prod  # Create production build
```

## Contributing

We welcome contributions!  
Please open issues or PRs for:

- New features (reminders, comments, file attachments, etc.)
- Bug fixes
- UI/UX improvements
- Performance optimizations

## License

MIT

---

**WorkHub** — Built in Lagos for teams that move fast.  
Let's build better work together. 🇳🇬🚀

Made with ❤️ by Raphael & the WorkHub community.  
Current version: v1.0.0 (January 2026)
