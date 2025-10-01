# Pomodoro Timer

A beautiful and feature-rich Pomodoro timer application built with React, Ant Design, and Capacitor. Perfect for boosting productivity with focused work sessions and regular breaks.

## Student Information

**Student's Name:** Nguyễn Xuân Phong  
**Student ID:** 22IT221

## Features

### ✨ Core Features
- **25/5 Minute Cycles**: Classic Pomodoro technique with 25-minute work sessions and 5-minute breaks
- **Background Timer**: Timer continues running even when the app is in the background
- **Local Notifications**: Get notified when sessions end, even if the app is not in focus
- **Haptic Feedback**: Vibration feedback on mobile devices when sessions complete
- **Session History**: Track your completed sessions and productivity over time

### 🎛️ Customization
- **Flexible Durations**: Customize work, short break, and long break durations
- **Sound Options**: Choose from different notification sounds or go silent
- **Long Break Intervals**: Set how many work sessions before a long break
- **Settings Persistence**: All settings are saved locally

### 📱 Cross-Platform
- **Progressive Web App (PWA)**: Install on any device and use offline
- **Mobile Ready**: Native mobile app support with Capacitor for iOS and Android
- **Responsive Design**: Beautiful UI that works on all screen sizes

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Ant Design
- **Mobile Framework**: Capacitor
- **State Management**: React Hooks
- **Storage**: Capacitor Preferences (local storage)
- **Notifications**: Capacitor Local Notifications
- **Haptics**: Capacitor Haptics

## Quick Start

### Web Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Mobile Development

```bash
# Build the web app
npm run build

# Sync with mobile platforms
npx cap sync

# Open in iOS (requires Xcode)
npx cap open ios

# Open in Android (requires Android Studio)
npx cap open android
```

## Project Structure

```
src/
├── components/           # React components
│   ├── PomodoroTimer.tsx    # Main timer component
│   ├── SessionHistory.tsx   # History tracking
│   └── Settings.tsx         # Settings panel
├── hooks/               # Custom React hooks
│   └── usePomodoro.ts      # Main timer logic
├── types/               # TypeScript definitions
│   └── pomodoro.ts         # Type definitions
└── App.tsx              # Main app component
```

## Key Components

### 🎯 PomodoroTimer
The main timer interface featuring:
- Large, readable countdown display
- Circular progress indicator
- Start/pause/stop/reset controls
- Quick session type selection buttons
- Visual session type indicators

### 📊 SessionHistory
Track your productivity with:
- Complete session history
- Session statistics (total sessions, work time, break time)
- Session status indicators (completed/incomplete)
- Date and time tracking
- Clear history functionality

### ⚙️ Settings
Customize your experience:
- Timer duration controls (1-90 minutes for work, 1-30 for short breaks, 5-60 for long breaks)
- Notification preferences (sound on/off, sound selection)
- Haptic feedback toggle
- Sessions until long break (2-10 sessions)

## Mobile Features

### 📱 Native Capabilities
- **Local Notifications**: Get notified even when the app is closed
- **Haptic Feedback**: Physical vibration when sessions complete
- **Background Processing**: Timer continues in the background
- **Native UI**: Smooth, native-feeling interface

### 🔔 Notification Permissions
The app will request notification permissions on first use. These are essential for:
- Session completion alerts
- Background timer notifications
- Productivity reminders

## Usage Tips

1. **Start Simple**: Begin with default 25/5 minute intervals
2. **Track Progress**: Use the history tab to monitor your productivity patterns
3. **Customize Gradually**: Adjust settings as you find your optimal work rhythm
4. **Stay Consistent**: Regular use helps build productive habits
5. **Take Breaks**: Don't skip breaks - they're essential for sustained focus

## Development

### Prerequisites
- Node.js 16+
- npm or yarn
- For mobile development:
  - iOS: Xcode 12+
  - Android: Android Studio with SDK 21+

### Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd pomodoro

# Install dependencies
npm install

# Start development
npm start
```

### Building for Production

```bash
# Web build
npm run build

# Sync mobile platforms
npx cap sync

# Build for iOS
npx cap build ios

# Build for Android
npx cap build android
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components by [Ant Design](https://ant.design/)
- Mobile capabilities by [Capacitor](https://capacitorjs.com/)
- Inspired by the [Pomodoro Technique](https://en.wikipedia.org/wiki/Pomodoro_Technique) by Francesco Cirillo

## Demo

### Screenshots

<div align="center">

**Main Timer Interface**
![Pomodoro Timer](public/images/Screenshot%202025-10-01%20at%2007.31.17.png)

**Notification & pop up when times up**
![Settings](public/images/Screenshot%202025-10-01%20at%2007.35.13.png)

**Notification**
![Session History](public/images/Screenshot%202025-10-01%20at%2007.35.21.png)

</div>