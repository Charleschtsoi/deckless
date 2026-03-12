# Mobile Slide

A mobile-first, web-based presentation creator that replaces legacy desktop .pptx files with lightweight, interactive, mobile-optimized web pages.

## 🎯 Purpose

**Mobile Slide is designed primarily for people who need to present on mobile devices.** Whether you're pitching an idea on your phone, presenting in a coffee shop, or sharing slides on a tablet, Mobile Slide creates beautiful, scrollable presentations optimized for mobile viewing and interaction.

## ✨ Features

- **Mobile-First Design**: Built from the ground up for mobile devices with touch-optimized interactions
- **AI-Powered Generation**: Create presentations from simple text prompts and images using LLM APIs
- **Visual Style Presets**: Choose from 11 curated themes with visual previews (Dark, Light, Specialty)
- **Scroll-Triggered Animations**: Smooth reveal animations as you scroll through slides
- **Inline Editing**: Edit slides directly without regenerating the entire deck
- **Lightweight & Fast**: No heavy desktop software required - everything runs in your browser
- **Multi-Provider Support**: Works with Claude (Anthropic), GPT (OpenAI), and Gemini (Google)
- **Image Integration**: Upload images from your camera roll and let AI map them to relevant slides
- **Vertical Scrolling**: Optimized for mobile vertical scrolling with smooth snap behavior
- **Progress Tracking**: Visual progress bar and thumbnail navigation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- API key from one of the supported LLM providers (Claude, OpenAI, or Google)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Charleschtsoi/mobile_slide.git
cd mobile_slide
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
LLM_PROVIDER=claude  # or 'gpt' or 'gemini'
CLAUDE_API_KEY=your_api_key_here
# or
OPENAI_API_KEY=your_api_key_here
# or
GOOGLE_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser (or on your mobile device on the same network)

## 📱 Usage

1. **Open the app** on your mobile device
2. **Enter your presentation context** - describe what you want to present (e.g., "Pitch for a new coffee shop in Mong Kok")
3. **Upload images** from your camera roll (optional)
4. **Tap "Generate"** to create your presentation
5. **View and present** - swipe through your slides on any mobile device

## 🏗️ Architecture

- **Frontend**: Next.js 16 with React, Tailwind CSS, and Framer Motion
- **Backend**: Next.js API routes with LLM provider abstraction
- **Validation**: Zod schemas for type-safe deck structures
- **Image Handling**: Base64 encoding (extensible to cloud storage)

## 📁 Project Structure

```
mobile_slide/
├── app/
│   ├── api/generate/    # API route for deck generation
│   └── page.tsx          # Main entry point
├── components/
│   ├── creator/          # Creator UI components
│   ├── viewer/           # Viewer UI components
│   └── shared/           # Shared components
└── lib/
    ├── schemas/          # Zod validation schemas
    └── utils/            # Utility functions
```

## 🔧 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Validation**: Zod

## 🤝 Contributing

Contributions are welcome! This is an open-source project designed to help people present effectively on mobile devices.

## 📝 License

MIT

## 🙏 Acknowledgments

Built to replace legacy desktop presentation software with modern, mobile-first web technology.
