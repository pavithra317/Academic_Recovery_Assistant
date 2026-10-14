# AI-Powered Academic Recovery Assistant (Frontend)

A responsive React + Vite web app that helps college students recover when their study plans fall apart.

---

## Part 1: One-time setup (Windows)

### Step 1. Install Node.js

1. Open your web browser and go to **https://nodejs.org**.
2. Download the **LTS** version (the one labeled "Recommended for most users").
3. Run the installer. Click **Next** on every screen and keep the default options.
4. When it finishes, restart VS Code if it was open.

To check that it worked, open **Command Prompt** (press the Windows key, type `cmd`, press Enter) and type:

```
node -v
npm -v
```

You should see version numbers (for example `v22.x.x` and `10.x.x`). If you see an error, restart your computer and try again.

### Step 2. Extract the ZIP file

1. Find `academic-recovery-assistant-windows.zip` in your Downloads folder.
2. Right-click it and choose **Extract All...**.
3. Choose a simple location, such as `C:\Users\YourName\Documents`. Avoid OneDrive folders if you can.
4. Click **Extract**.

You should now have a folder named **`academic-recovery-assistant`**. Open it. You should see files such as `package.json`, `index.html`, and `vite.config.js` directly inside it (not in another folder).

### Step 3. Open the project in VS Code

1. Open VS Code.
2. Click **File → Open Folder...**
3. Select the **`academic-recovery-assistant`** folder (the one that contains `package.json`) and click **Select Folder**.
4. If VS Code asks "Do you trust the authors of the files in this folder?", click **Yes, I trust the authors**.

> **Important:** the folder you open must be the one that directly contains `package.json`.
> If you open the folder above it, `npm install` will fail with `ENOENT ... could not read package.json`.

To confirm you have the right folder, open the VS Code terminal (**Terminal → New Terminal**) and type:

```
dir package.json
```

If the file is listed, you are in the right place. If you see "File Not Found", open the correct folder as described above.

---

## Part 2: Run the app (every time)

In the VS Code terminal, run these commands one at a time.

### Step 1. Install the project libraries (only needed once, or after changes to package.json)

```
npm install
```

This downloads the libraries listed in `package.json` into a `node_modules` folder. It can take 1–3 minutes. Wait until the cursor returns.

### Step 2. Start the development server

```
npm run dev
```

You will see a message like this:

```
  VITE v5.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
```

### Step 3. Open the app

Hold **Ctrl** and click the `http://localhost:5173/` link in the terminal, or open your browser and go to **http://localhost:5173**.

To stop the server, click inside the terminal and press **Ctrl + C**.

---

## Other useful commands

| Command         | What it does                                  |
|-----------------|-----------------------------------------------|
| `npm run dev`   | Runs the app for development (use this one)   |
| `npm run build` | Creates an optimized production build in `dist/` |
| `npm run preview` | Previews the production build               |
| `npm test`      | Runs the unit tests                           |

---

## Troubleshooting

**`npm error code ENOENT` / `could not read package.json`**
You opened the wrong folder. Use **File → Open Folder** and select the folder that directly contains `package.json` (see Part 1, Step 3).

**`'npm' is not recognized as an internal or external command`**
Node.js is not installed correctly. Reinstall the LTS version from nodejs.org, then restart VS Code.

**PowerShell says running scripts is disabled**
Use the Command Prompt instead, or in PowerShell run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` and answer `Y`.

**Port 5173 is already in use**
Another dev server is running. Stop it with Ctrl + C, or run `npm run dev -- --port 5174` and open http://localhost:5174.

**The page looks unstyled or the font looks plain**
The design font loads from Google Fonts, so you need an internet connection. The app still works without it.

**Something looks broken after changes**
Stop the server (Ctrl + C), run `npm install` again, then `npm run dev`.

---

## What the app includes

| Route        | Page               | Purpose                                                        |
|--------------|--------------------|----------------------------------------------------------------|
| `/`          | Dashboard          | Summary cards, upcoming deadlines, study priorities, hero with Generate Recovery Plan |
| `/tasks`     | My Tasks           | Add, edit, delete, start, and complete tasks; filter by status |
| `/recovery`  | AI Recovery Plan   | Focus-block timeline, recommendations, overdue triage, momentum |
| `/study`     | AI Study Assistant | Enter a topic to request study notes (needs the backend)       |
| `/progress`  | Progress Tracking  | Completion stats, weekly chart, subject breakdown, study settings |

Your tasks and settings are saved in your browser (localStorage). They stay after you refresh the page, but are specific to that browser.

### Project structure

```
academic-recovery-assistant/
  package.json          project info and libraries (must stay directly in this folder)
  vite.config.js        Vite settings
  index.html            the single HTML page Vite serves
  .env.example          template for the optional backend URL
  README.md             this file
  src/
    main.jsx            app entry point
    App.jsx             route table
    context/            shared task and settings state
    pages/              one file per page
    components/         reusable pieces (header, cards, forms, chart, etc.)
    services/           backend calls (api.js is the only place that calls fetch)
    utils/              calculations, validation, planner, dates
    data/               demo data shown on first load
    styles/             colors and layout (index.css, app.css)
    tests/              unit tests
```

---

## Backend (FastAPI + MongoDB + Gemini)

The Python server lives in the `backend/` folder. Follow **backend/README.md** for the full step-by-step guide, including:
- creating a MongoDB Atlas database and a Gemini API key
- creating a Python virtual environment on Windows
- running the server with `uvicorn main:app --reload --port 8000`
- testing every endpoint at http://localhost:8000/docs

To connect the frontend, create a `.env` file in this project folder containing:

```
VITE_API_BASE_URL=http://localhost:8000
```

Then restart `npm run dev`. Without this line, the app keeps working offline with data stored in your browser.
