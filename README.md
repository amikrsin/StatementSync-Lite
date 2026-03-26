# StatementSync Lite 📊

StatementSync Lite is a high-performance Progressive Web App (PWA) that converts complex PDF documents (like bank statements and ledgers) into perfectly formatted Excel files using Gemini 3 Flash.

## 🚀 Features

- **Bring Your Own Key (BYOK):** Securely use your own Gemini API key stored locally in your browser.
- **Chunked Processing:** Automatically splits large PDFs into chunks to ensure 100% data extraction accuracy without hitting AI limits.
- **Intelligent Merging:** Merges tables across multiple pages into a single, clean Excel sheet.
- **Privacy First:** All processing happens client-side via the Gemini SDK. Your documents never touch our servers.
- **PWA Ready:** Installable on desktop and mobile for a native experience.
- **Real-time Progress:** Visual feedback for large document processing.
  
<img width="1918" height="911" alt="image" src="https://github.com/user-attachments/assets/c10eb17f-2e35-4a19-a542-5aa2763b8a29" />

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **AI Engine:** Google Gemini 3 Flash (`@google/genai`)
- **PDF Handling:** `pdf-lib`
- **Excel Generation:** `xlsx` (SheetJS)
- **Animations:** `motion/react` (Framer Motion)

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/statementsync-lite.git
   cd statementsync-lite
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## ☁️ Deployment

### Cloudflare Pages (Recommended)

1. Push your code to a GitHub repository.
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
4. Select your repository.
5. Use the following build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
6. Click **Save and Deploy**.

### Cloudflare Workers (Static Assets)

If you prefer using a Worker with `wrangler`:

1. Install Wrangler: `npm install -D wrangler`
2. Build the app: `npm run build`
3. Deploy: `npx wrangler pages deploy dist`

## 🔒 Security & Privacy

- **API Keys:** Your Gemini API key is stored in `localStorage`. It is only used to make direct requests to `generativelanguage.googleapis.com`.
- **Data:** PDF data is converted to Base64 in-memory and sent directly to Google's API. No data is stored or logged by this application.

## 📄 License

Apache-2.0
