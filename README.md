# BalanceFlow AI Calendar

BalanceFlow is an AI-powered calendar application designed to help you schedule tasks intelligently, maintain a healthy work-life balance, and prevent burnout by automatically optimizing your schedule and suggesting wellness activities.

## 🚀 Features
- **Intelligent Natural Language Input**: Add tasks, recurring events, and holidays using conversational language.
- **Advanced AI Scheduling**: Powered by the Gemini API, the app understands complex queries, sets up recurring events (daily, weekly, etc.), and populates your calendar automatically.
- **Dynamic Contextual Suggestions**: Receive AI-powered suggestions for meals, activities, and more based on your schedule and upcoming events (like holidays or busy days).
- **Full Recurrence Support**: Create tasks that repeat and manage their completion on an individual basis.
- **Unscheduled "To-Do" List**: Park tasks without a date in a separate panel and drag them onto the calendar when you're ready.
- **Dynamic Calendar Views**: Switch between Day, Week, and Month views with visual workload indicators.
- **Local Data Storage**: All tasks and events are saved in your browser for offline access and persistence.
- **Configurable Reminders**: Set local notifications for your important tasks.
- **Easy Task Management**: Edit, delete, and drag-and-drop reschedule your tasks.

## 🛠 Tech Stack
- React 19 with TypeScript
- Tailwind CSS
- Google Gemini API for AI-powered scheduling
- React Hooks & Context API for state management
- Local Storage for data persistence
- Web Notification API for reminders

## 📦 Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/jviper/balanceflow-ai-calendar.git
    cd balanceflow-ai-calendar
    ```
2.  Install dependencies:
    ```bash
    npm install # or yarn install
    ```
3.  Run the development server:
    ```bash
    npm start # or yarn start
    ```
4.  Open your browser and visit `http://localhost:3000` (or the address shown in your terminal).

## 💡 Usage
1.  Use the input box to type complex tasks like `"July 4th Independence Day, and watch fireworks at 8:30pm. Also, feed the dog every day at 8am and 6pm."`
2.  Click "Add with AI". The AI will parse your input, schedule the events, create recurring tasks, and even offer contextual suggestions.
3.  Manage your schedule in the calendar. Mark individual instances of recurring tasks as complete.
4.  Drag unscheduled tasks from the sidebar onto the calendar to schedule them.
5.  Check the "AI Suggestions" panel for ideas tailored to your day.
6.  Ensure browser notifications are enabled to receive reminders.