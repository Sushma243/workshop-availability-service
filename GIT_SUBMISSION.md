# Share this project as a Git repo (e.g. GitHub)

Follow these steps to push the project and share a **repo link** instead of a zip.

## 1. Initialize Git and make the first commit (if not already done)

From the project root:

```bash
cd workshop-availability-service   # or your project folder path

git init
git add .
git status                         # optional: check what will be committed
git commit -m "Initial commit: Workshop Availability Service"
```

## 2. Create a new repository on GitHub

1. Go to [github.com](https://github.com) and sign in.
2. Click **“+”** → **“New repository”**.
3. Choose a name (e.g. `workshop-availability-service`).
4. Leave it **empty** (no README, no .gitignore).
5. Click **“Create repository”**.

## 3. Connect and push

GitHub will show commands like these. Use **your** repo URL:

```bash
git remote add origin https://github.com/YOUR_USERNAME/workshop-availability-service.git
git branch -M main
git push -u origin main
```

If you use SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/workshop-availability-service.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `workshop-availability-service` with your GitHub username and repo name.

## 4. Share the link

Send the repo URL to the reviewer, e.g.:

- `https://github.com/YOUR_USERNAME/workshop-availability-service`

They can clone with:

```bash
git clone https://github.com/YOUR_USERNAME/workshop-availability-service.git
cd workshop-availability-service
npm install && npm run build && npm start
```
