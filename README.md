> **🚀 Deployed Website:** [https://temreyildirim8.github.io/Timebox/](https://temreyildirim8.github.io/Timebox/)

---

![App Demo](public/demo.gif)

# ⏱️ Timebox

## 📖 About the Project

A minimalist personal time-boxing application inspired by [timebox.so](https://www.timebox.so/). Designed with a local-first philosophy, the app ensures all your data remains private and is stored securely within your browser.

## ✨ Features

- **Daily Planning:** Effortlessly add tasks and notes for every day.
- **Rapid Scheduling:** Quickly schedule tasks on the calendar for efficient time-boxing and time-blocking.
- **Data Portability:** Built-in Export and Import functionality to save your data to a file, providing a backup whenever you need to clear your browser data.

## 🚀 Getting Started

Follow these steps to get a local copy up and running on your machine.

### Prerequisites

Make sure you have Node.js and npm installed on your machine.

### 1. Installation & Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/nitish-17/Timebox.git
    ```
2.  Navigate into the project directory:
    ```bash
    cd Timebox
    ```
3.  Install NPM packages:
    ```bash
    npm install
    ```
4.  Start the development server (Optional):
    ```bash
    npm run dev
    ```

---

## ⚙️ Running Locally (Persistent Background Process)

To run this application continuously in the background—even after you close your terminal or restart your computer—we will use **PM2** (a process manager) and **serve** (a static file server).

### 1. Build the project (creates the `dist` folder):

```bash
npm run build
```

### 2. Install pm2

Install pm2 and serve globally on your machine:

```bash
npm install -g pm2
npm install -g serve
```

### 3. Start the Application

Run the following command to serve the `dist` folder on port 5173 and name the process `timebox`:

```
pm2 start "serve -s dist -l 5173" --name "timebox"
```

### 4. Enable Auto-Start on Boot

To ensure the application starts automatically if your computer restarts, run these two commands:

```
pm2 save
pm2 startup
```

> **⚠️ Note:** Running `pm2 startup` will print a specific command in your terminal (it usually starts with `sudo env PATH...`). **Copy and paste that exact command into your terminal and hit Enter.**

### 5. Verification

1. Close your terminal completely.
2. Open your web browser.
3. Go to [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173).
4. Your app should be running successfully!

---

## 🛠️ Troubleshooting & Management

If you ever need to check on your app, stop it, or view logs, open a terminal and use these PM2 commands:

- **Check status:** `pm2 status`
- **See error logs:** `pm2 logs timebox`
- **Stop the app:** `pm2 stop timebox`
- **Delete the process:** `pm2 delete timebox`

> **💡 Important Note for Updates:** > If you make changes to your code, those changes will not appear automatically. You must rebuild the project and restart the PM2 process:
>
> ```
> npm run build
> pm2 restart timebox
> ```

---

> **🚀 Deployed Website:** [https://temreyildirim8.github.io/Timebox/](https://temreyildirim8.github.io/Timebox/)
