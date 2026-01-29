# Fluide

French chunking practice app based on the method by Français avec Pierre. Practice selecting chunks, drilling pronunciation, writing sentences (with optional grammar check), and a timed mini-monologue. Includes a chunk library (add/edit/delete custom chunks) and practice history.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set your Gemini API key for the grammar-check feature:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add:
   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```
   Get a key at [Google AI Studio](https://aistudio.google.com/apikey).
3. Run the dev server: `npm run dev`
4. Build for production: `npm run build`

## Tech

- Vite + React + TypeScript
- Tailwind CSS
- `@google/genai` for client-side grammar check (no backend)
