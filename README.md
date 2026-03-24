# Navatar Admin Dashboard

A secure, multi-tenant hospital administration dashboard built with **Next.js 16**, **Tailwind CSS**, and **Firebase** (Auth + Firestore).

## Features

- **Google Authentication** — Validates admins against the `hospitals` Firestore collection
- **Multi-Admin Support** — Primary admins can invite additional administrators
- **Doctor Management** — Add, enable/disable, and remove doctors
- **Navatar Monitoring** — View deployed AI bots and their usage analytics
- **Usage Analytics** — Charts and metrics powered by real Firestore data

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/Navatar-admin.git
cd Navatar-admin
npm install
```

### 2. Configure Environment

Copy the example env file and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── admins/       # Multi-admin management
│   │   ├── doctors/      # Doctor CRUD + add form
│   │   ├── navatars/     # Bot listing + [id] analytics
│   │   ├── layout.js     # Sidebar + Header wrapper
│   │   └── page.js       # Overview dashboard
│   ├── login/            # Google Auth login
│   ├── layout.js         # Root layout with AuthProvider
│   └── page.js           # Redirect to /dashboard
├── components/layout/    # Sidebar, Header
├── contexts/             # AuthContext (Firebase Auth + Firestore)
└── lib/
    ├── firebase/config.js
    └── utils.js
```

## Firestore Schema

### `hospitals` Collection
| Field | Type | Description |
|---|---|---|
| `adminEmail` | string | Primary admin email |
| `additionalAdmins` | string[] | Secondary admin emails |
| `botIds` | string[] | Provisioned Navatar bot IDs |
| `hospitalName` | string | Display name |
| `status` | string | `active` or `inactive` |

### `doctors` Collection
| Field | Type | Description |
|---|---|---|
| `name` | string | Doctor full name |
| `email` | string | Doctor email |
| `designation` | string | Specialization |
| `hospitalId` | string | Reference to hospital doc ID |
| `status` | string | `active` or `disabled` |

### `navatar_usage` Collection
| Field | Type | Description |
|---|---|---|
| `botId` | string | Navatar bot ID |
| `timestamp` | Timestamp | When interaction occurred |
| `duration` | number | Interaction duration (seconds) |
| `patientQuery` | string | User query text |

## Tech Stack

- [Next.js 16](https://nextjs.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/) (Auth, Firestore)
- [Recharts](https://recharts.org/)
- [Lucide React](https://lucide.dev/)
