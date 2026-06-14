# ClipMind AI

**Select anything on any website. ClipMind saves it with source, summary, tags, and lets you manage your saved web knowledge.**

ClipMind AI is an AI-powered web memory and research clipping Chrome Extension. Capture text selections, images, and full pages — then search, organize, and ask questions about your saved knowledge. All data stays local in your browser.

## Features

- **Text Selection Capture** — Floating bubble with Save, Summarize, Explain, and Add to Project
- **Image Capture** — Right-click any image to save via context menu
- **Quick Save Page** — Save the current page from the popup with optional notes
- **AI Summary System** — Mock AI generates titles, summaries, tags, and categories (ready for real API integration)
- **Auto Categories** — Study, Coding, Business, Design Inspiration, and more
- **Dashboard / Side Panel** — Search, filter, sort, stats, and clip cards
- **Clip Detail View** — Full content, AI actions, notes, project assignment
- **Ask My Memory** — Query your saved clips with natural language
- **Project Spaces** — Organize clips into folders (Inbox + custom projects)
- **Export** — JSON export for all clips, Markdown copy per clip
- **Privacy First** — All data stored locally, no account, no tracking

## Tech Stack

- Chrome Extension Manifest V3
- React 18 + Vite + TypeScript
- Chrome Storage API (local-first)
- Mock AI provider abstraction (OpenAI/Gemini placeholders included)

## Installation

### Prerequisites

- Node.js 18+
- Google Chrome

### Build

```bash
cd clipmind-ai
npm install
npm run build
```

### Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `clipmind-ai/dist` folder

### Development

```bash
npm run dev
```

Rebuilds on file changes. Reload the extension in `chrome://extensions` after each build.

## Usage

### Capture Text
1. Select text on any webpage
2. A ClipMind bubble appears near your selection
3. Choose **Save**, **Summarize**, **Explain**, or **Project**

### Capture Images
1. Right-click any image
2. Select **Save image to ClipMind AI**

### Save Current Page
1. Click the ClipMind icon in the toolbar
2. Click **Save Current Page** or **Save with Note**

### Dashboard
1. Click **Open Dashboard** in the popup, or open the side panel
2. Search, filter, and manage all your clips
3. Use **Ask My Memory** to query your saved knowledge

### Settings
1. Click ⚙️ in the popup or dashboard, or right-click the extension → **Options**
2. Choose AI provider (Mock, OpenAI, Gemini, Claude)
3. Toggle dark mode and selection bubble preferences

## Project Structure

```
clipmind-ai/
├── manifest.json
├── package.json
├── vite.config.ts
├── src/
│   ├── background/       # Service worker + context menus
│   ├── content/          # Selection bubble + content script
│   ├── popup/            # Extension popup
│   ├── sidepanel/        # Dashboard side panel
│   ├── components/       # Shared React components
│   ├── services/         # Storage, clip, and AI services
│   ├── utils/            # Helpers (markdown, dates, categories)
│   ├── types/            # TypeScript interfaces
│   └── styles/           # Global CSS
└── public/icons/         # Extension icons
```

## AI Provider Integration

The extension uses a provider abstraction layer. By default, the **mock provider** runs locally with no API keys.

To connect a real AI provider:

1. Implement the `AIProvider` interface in `src/services/ai/`
2. Add your API key handling (recommend Chrome storage + options page)
3. Switch provider in `src/services/ai/providerFactory.ts`

Placeholder files included:
- `openAiProvider.placeholder.ts`
- `geminiProvider.placeholder.ts`
- `claudeProvider.placeholder.ts`

Configure your provider in **Settings** (right-click extension icon → Options, or ⚙️ in popup/dashboard).

### Mock AI Features
- Title generation from content keywords
- Summarization from first sentences
- Tag extraction from word frequency
- Category detection via keyword matching
- Memory Q&A via local clip search + relevance scoring

## Privacy

- All clips are stored in `chrome.storage.local`
- No data is sent to external servers in the MVP
- No analytics or tracking
- No account required

## Permissions

| Permission | Purpose |
|---|---|
| `storage` | Save clips locally |
| `contextMenus` | Image right-click save |
| `activeTab` | Access current page info |
| `scripting` | Content script injection |
| `sidePanel` | Dashboard side panel |
| `<all_urls>` | Capture from any website |

## Future Upgrades (Paid Version Ideas)

- Real AI providers (OpenAI, Gemini, Claude, local LLM)
- Cloud sync across devices
- Team/shared project spaces
- Browser sync backup
- OCR for saved images
- PDF and article full-page capture
- Smart duplicate merging
- Scheduled clip review/reminders
- Browser new-tab memory dashboard
- Advanced semantic search with embeddings
- Custom AI prompts and workflows
- Export to Notion, Obsidian, Google Docs

## License

MIT
