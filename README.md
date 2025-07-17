  🌱 AgroFarm - Telegram WebApp Farming Game

A full-featured farming game developed as a Telegram WebApp with TON blockchain integration and AI functionality.

Dive into an exciting world of farming powered by artificial intelligence.

<img width="333" height="500" alt="2" src="https://github.com/user-attachments/assets/7d00a193-502a-4476-99a6-da4dcc372636" />

Your farm keeps expanding even while you’re away: crops grow relentlessly and pests appear alongside them. To keep your plants alive and healthy, water them regularly and apply pesticides when necessary.
Sell your harvest on a dynamic market where prices shift in real time, driven by in-game news, so stay alert. 
Combine smart farming practices with trading strategy: buy vegetables at their lowest price and sell at peak demand to maximize profit.
Move wisely, balance farm care with market speculation, and transform your fields into a high-tech profit empire!

<img width="1536" height="1024" alt="7" src="https://github.com/user-attachments/assets/c02d52bb-f91a-4058-86f2-79cf47bfce07" />

## Technologies

### Frontend
- **React 19** - UI framework
- **TypeScript** - static typing
- **Styled Components** - styling
- **Redux Toolkit** - state management
- **React Router** - routing
- **Recharts** - charts and analytics
- **TON Connect** - blockchain integration
- **OpenAI API** - AI features

### Backend
- **Node.js** - server runtime
- **Express.js** - web framework
- **TypeScript** - static typing
- **MongoDB** + **Mongoose** - database
- **OpenAI API** - AI services
- **CORS** - cross-origin requests

## Installation

### Prerequisites
- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **MongoDB** >= 5.0.0
- **Git**

### Clone Repository
bash
git clone https://github.com/rosaiwork/AgroFarm.git
cd AgroFarm

### Install Dependencies
bash
# Install all dependencies (client + server)
npm run install-all

or separately:
bash
# Root dependencies
npm install

# Client dependencies
cd client && npm install

# Server dependencies
cd ../server && npm install

### Configuration

#### Server Setup
Create server/.env file:
env
MONGODB_URI=mongodb://localhost:27017/agrofarm
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development

#### Client Setup
Create client/.env file:
env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_TON_CONNECT_MANIFEST=http://localhost:3000/tonconnect-manifest.json
