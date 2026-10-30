# Publish and accept contributions

1. Create a new PUBLIC GitHub repository named iist-campus-walk. Use main as its default branch.
2. Upload the CONTENTS of this folder to the repository root, not this parent folder and not the ZIP. Include dist/, scripts/, .github/, map.osm and the Markdown files. On Ubuntu, Ctrl+H shows the .github folder in the file manager. Commit the upload to main.
3. In repository Settings > Pages > Build and deployment, choose **Deploy from a branch**. Select branch **main** and folder **/ (root)**, then Save. The root index opens the app in `dist/`. Use the full project URL below; the account root is a different site.
4. When a pull request is merged into main, GitHub Pages builds it automatically. The repository workflow runs checks; it does not publish a second, competing deployment. The public address is https://swasthik-visakh-s.github.io/iist-campus-walk/. GitHub Pages may cache files for up to ten minutes; use Ctrl+Shift+R after a deployment if an older page remains visible.
5. Visitors fork the repository and open pull requests. Review the Files changed tab, test locally and merge when satisfied. Only merged main changes deploy. Keep ordinary visitors as contributors through forks, without giving them write access.

Optional: create a branch ruleset for main requiring pull requests and passing check status. If you also add collaborators with write access, restrict bypass/merging as appropriate. Do not require an approval from yourself on your own pull request: GitHub does not allow authors to approve their own PRs.

The archive includes no ChatGPT-specific hosting identity or Git credentials. GitHub Pages hosts the browser app publicly and does not require visitors to sign into ChatGPT. Your previous ChatGPT-hosted copy remains separate.
