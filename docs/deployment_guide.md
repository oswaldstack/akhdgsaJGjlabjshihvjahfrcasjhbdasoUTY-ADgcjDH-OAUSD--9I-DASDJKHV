# Free Legal Page Hosting with GitHub Pages

Since your app is already in a GitHub repository, using GitHub Pages is the best way to host your Privacy Policy and Terms for free.

## Step 1: Ensure Your Files are Ready
Your files are in the `admin web` folder. For GitHub Pages to serve them correctly from the root, you have two options:
1.  **Repo-wide hosting**: Files are served from the main branch.
2.  **Subfolder hosting**: Files are served from a specific folder (like `docs`).

### Recommended Approach: Moving to `docs/`
GitHub Pages allows you to host files directly from a `/docs` folder on your main branch.

1.  Create a folder named `docs` in your project root.
2.  Copy `privacy.html`, `terms.html`, `index.html`, `styles.css`, and `app.js` into the `docs` folder.
3.  Commit and push these changes to GitHub.

## Step 2: Enable GitHub Pages
1.  Go to your GitHub repository on the web.
2.  Click **Settings** (top right).
3.  On the left sidebar, click **Pages**.
4.  Under **Build and deployment** > **Source**, select `Deploy from a branch`.
5.  Under **Branch**, select `main` (or your default branch) and the `/docs` folder.
6.  Click **Save**.

## Step 3: Access Your URLs
After a few minutes, your site will be live at:
`https://[your-username].github.io/[repo-name]/index.html`

Your legal links for the Play Store will be:
- **Privacy Policy**: `https://[your-username].github.io/[repo-name]/privacy.html`
- **Terms & Conditions**: `https://[your-username].github.io/[repo-name]/terms.html`

> [!TIP]
> You can test these URLs in your browser immediately after GitHub says the deployment is successful.
