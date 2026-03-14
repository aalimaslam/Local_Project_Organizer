# Dev Dashboard

A local developer dashboard consisting of a Vue 3/Vite frontend and a Node.js/Express backend. This application allows you to manage and launch your local development projects from a single unified interface.

## 🚀 New Features

- **AI-Powered Analysis**: Automatically generate project descriptions, tags, and start commands using LLMs (Gemini, OpenAI, Kimi, or local Ollama).
- **Bulk Add Projects**: Scan a parent directory and add multiple projects at once.
- **Provider Agnostic**: Configure your own LLM provider and settings directly from the dashboard.
- **One-Click Launch**: Start your projects with detected or custom commands directly from the UI.

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

## Project Structure

- `frontend/`: Vue 3, Vite, Tailwind CSS, Vue Router client application.
- `backend/`: Node.js, Express backend that stores data in a local `projects.json` and `settings.json`.

## Getting Started

### 1. Start the Backend

The backend runs on port 6001 by default.

```bash
cd backend
npm install
node server.js
```

### 2. Start the Frontend

The frontend development server runs using Vite on port 6002.

```bash
cd frontend
npm install
npm run dev -- --port 6002
```

Open your browser and navigate to `http://localhost:6002`.

## 🛠 Features

- **View locally configured projects**: Beautiful grid view of all your local dev environments.
- **AI Settings**: Configure your LLM provider (Gemini, OpenAI, Kimi, Ollama, or any OpenAI-compatible API).
- **Bulk Add**: Scan directory trees to quickly register multiple projects.
- **Open in VS Code**: Quick access to your code.
- **Open Folder**: Open the project directory in your file explorer.
- **Simple JSON Storage**: Easy to manage and backup with `projects.json`.

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes (`git commit -am 'Add an awesome feature'`)
4. Push to the branch (`git push origin feature/awesome-feature`)
5. Open a Pull Request

## License

MIT License

## Desktop Start icon 
Copy the `start-dashboard.bat` file to your desktop or desired location to quickly launch both frontend and backend servers.
