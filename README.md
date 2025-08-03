# 🕌 Meshkah - Islamic Knowledge Platform

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black.svg)](https://nextjs.org/)

A comprehensive Islamic knowledge platform featuring hadith sharing, daily reminders, Islamic library, quiz system, and admin dashboard. Built with modern web technologies and designed for Arabic language support.

## 🌟 Features

### 📚 Islamic Library
- **Comprehensive Hadith Database**: Access to thousands of authentic hadiths
- **Smart Search**: Advanced search with Arabic text support
- **Categories & Tags**: Organized by Islamic topics and themes
- **Bookmarking System**: Save and organize favorite hadiths
- **Daily Hadith**: Curated daily hadith with AI analysis
- **Public Sharing**: Share hadiths with beautiful cards

### 🎯 Quiz System
- **AI-Powered Questions**: Personalized quizzes based on reading history
- **Multiple Categories**: Aqeedah, Ibadah, Muamalat, Akhlaq, Seerah, Hadith
- **Difficulty Levels**: Beginner, Intermediate, Advanced
- **Progress Tracking**: Monitor learning progress and performance
- **Real-time Scoring**: Immediate feedback and detailed explanations

### 📱 Chrome Extension
- **Daily Reminders**: Get notified with daily hadiths
- **Quick Access**: Instant access to Islamic content
- **Customizable Settings**: Personalize notification preferences
- **Offline Support**: Works without internet connection

### 🎨 Modern UI/UX
- **Elegant Design**: Glass-morphism and modern animations
- **Responsive Layout**: Works perfectly on all devices
- **Arabic RTL Support**: Full right-to-left text support
- **Dark/Light Themes**: Customizable appearance
- **Smooth Animations**: Framer Motion powered interactions

### 🔧 Admin Dashboard
- **User Management**: Monitor and manage user accounts
- **Content Analytics**: Track platform usage and engagement
- **Print Requests**: Handle physical content requests
- **Memorization Plans**: Manage Islamic learning programs
- **Real-time Statistics**: Live platform metrics

## 🏗️ Architecture

```
meshkah/
├── backend/                 # Node.js Express API
├── frontend/               # React Vite Application
├── dashboard/              # Next.js Admin Dashboard
├── chrome-extension/       # Chrome Extension
└── QUIZ_SYSTEM_README.md  # Quiz System Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Redis (optional, for caching)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Anas-Shalaby/meshkah.git
cd meshkah
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file with database credentials
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Dashboard Setup
```bash
cd dashboard
npm install
npm run dev
```

### 5. Chrome Extension
```bash
cd chrome-extension
# Load the extension in Chrome:
# 1. Open Chrome Extensions (chrome://extensions/)
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select the chrome-extension folder
```

## 📦 Project Structure

### Backend (`/backend`)
```
backend/
├── config/                 # Database, auth, scheduler configs
├── controllers/            # Business logic controllers
├── data/                  # Static data files
├── middleware/             # Express middleware
├── models/                # Database models
├── routes/                # API route handlers
├── services/              # External service integrations
├── utils/                 # Helper utilities
└── index.js               # Main server file
```

**Key Features:**
- RESTful API with Express.js
- MySQL database with mysql2
- JWT authentication
- Google OAuth integration
- File upload handling
- Email notifications
- Socket.io real-time features
- Rate limiting and security
- Task scheduling with node-cron

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── services/          # API service layer
│   ├── utils/             # Helper utilities
│   ├── hooks/             # Custom React hooks
│   ├── context/           # React context providers
│   └── assets/            # Static assets
├── public/                # Public assets
└── package.json
```

**Key Features:**
- React 18 with Vite
- Tailwind CSS for styling
- Framer Motion animations
- React Router for navigation
- React Query for data fetching
- PWA capabilities
- Arabic RTL support
- Responsive design

### Dashboard (`/dashboard`)
```
dashboard/
├── src/
│   ├── app/               # Next.js app directory
│   ├── components/        # Dashboard components
│   ├── lib/              # Utility libraries
│   └── services/         # API services
└── package.json
```

**Key Features:**
- Next.js 15 with App Router
- TypeScript support
- Admin authentication
- Analytics dashboard
- User management
- Content moderation tools

### Chrome Extension (`/chrome-extension`)
```
chrome-extension/
├── background.js          # Service worker
├── content.js            # Content script
├── settings.html         # Extension popup
├── manifest.json         # Extension manifest
└── icons/               # Extension icons
```

**Key Features:**
- Manifest V3
- Daily hadith notifications
- Customizable settings
- Background sync
- Cross-origin permissions

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/verify` - Token verification

### Hadith Management
- `GET /api/hadith/random` - Get random hadith
- `GET /api/hadith/:id/details` - Get detailed hadith info
- `GET /api/hadith/:id/simple` - Get simple hadith info
- `GET /api/hadith/hadith-ids` - Get all hadith IDs

### Bookmarks & Cards
- `GET /api/bookmarks` - Get user bookmarks
- `POST /api/bookmarks` - Add bookmark
- `GET /api/card/dawah-cards` - Get user's dawah cards
- `POST /api/card/create` - Create dawah card

### Quiz System
- `POST /api/ai-quiz/generate-quiz` - Generate AI quiz
- `POST /api/quiz-session/start` - Start quiz session
- `POST /api/quiz-session/submit` - Submit quiz answers
- `GET /api/quiz-session/history` - Get quiz history

### Admin Dashboard
- `GET /api/admin/users` - Get all users
- `GET /api/admin/analytics` - Get platform analytics
- `POST /api/admin/print-requests` - Handle print requests

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts and profiles
- `hadiths` - Hadith content and metadata
- `hadith_collections` - Hadith collections
- `bookmarks` - User bookmarks
- `dawah_cards` - User-created hadith cards
- `card_hadiths` - Hadiths in cards

### Quiz System Tables
- `quiz_sessions` - Quiz session data
- `quiz_questions` - Individual questions
- `quiz_answers` - User answers
- `quiz_categories` - Quiz categories
- `quiz_difficulty_levels` - Difficulty levels

### Admin Tables
- `print_requests` - Physical content requests
- `memorization_plans` - Learning plans
- `plan_users` - Users in plans

## 🎨 UI/UX Features

### Design System
- **Glass-morphism**: Translucent elements with backdrop blur
- **Gradient Backgrounds**: Purple to blue gradient themes
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive Grid**: Adaptive layouts for all screen sizes
- **Arabic Typography**: Optimized for Arabic text display

### Components
- **Animated Cards**: Hover effects and entrance animations
- **Loading States**: Skeleton loaders and spinners
- **Toast Notifications**: Success/error feedback
- **Modal Dialogs**: Smooth open/close transitions
- **Progress Indicators**: Visual progress tracking

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: API request throttling
- **Input Validation**: Request data sanitization
- **CORS Configuration**: Cross-origin security
- **Password Hashing**: bcrypt encryption
- **Session Management**: Secure session handling

## 📱 Mobile Support

- **Responsive Design**: Mobile-first approach
- **Touch Gestures**: Swipe and tap interactions
- **Offline Capabilities**: PWA features
- **Push Notifications**: Real-time updates
- **Progressive Enhancement**: Works without JavaScript

## 🚀 Deployment

### Backend Deployment
```bash
cd backend
npm run prod
pm2 start index.js --env production
pm2 save
pm2 startup
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting service
```

### Dashboard Deployment
```bash
cd dashboard
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Hadith Sources**: Integration with authentic Islamic hadith databases
- **Arabic Typography**: Special thanks to Arabic font contributors
- **Open Source Community**: Built with amazing open-source libraries
- **Islamic Scholars**: For guidance in authentic content curation

## 📞 Support

- **Email**: support@meshkah.com
- **Documentation**: [Wiki](https://github.com/Anas-Shalaby/meshkah/wiki)
- **Issues**: [GitHub Issues](https://github.com/Anas-Shalaby/meshkah/issues)

---

**Made with ❤️ for the Islamic community**

*"Seeking knowledge is obligatory upon every Muslim" - Prophet Muhammad ﷺ* 