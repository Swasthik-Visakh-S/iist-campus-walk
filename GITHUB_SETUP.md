# Publish and accept contributions

1. Create a new PUBLIC GitHub repository named iist-campus-walk. Use main as its default branch.
2. Upload the CONTENTS of this folder to the repository root, not this parent folder and not the ZIP. Include dist/, scripts/, .github/, map.osm and the Markdown files. On Ubuntu, Ctrl+H shows the .github folder in the file manager. Commit the upload to main.
3. In repository Settings > Pages > Build and deployment, choose GitHub Actions as the Source. The included workflow is already configured; do not create another workflow.
4. In Actions, select Check and publish campus > Run workflow > main > Run workflow. After it succeeds, Settings > Pages shows your public website address.
5. Visitors fork the repository and open pull requests. Review the Files changed tab, test locally and merge when satisfied. Only merged main changes deploy. Keep ordinary visitors as contributors through forks, without giving them write access.

Optional: create a branch ruleset for main requiring pull requests and passing check status. If you also add collaborators with write access, restrict bypass/merging as appropriate. Do not require an approval from yourself on your own pull request: GitHub does not allow authors to approve their own PRs.

The archive includes no ChatGPT-specific hosting identity or Git credentials. GitHub Pages hosts the browser app publicly and does not require visitors to sign into ChatGPT. Your previous ChatGPT-hosted copy remains separate.
