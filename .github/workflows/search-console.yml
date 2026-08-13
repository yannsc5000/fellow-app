name: Refresh Search Console export

on:
  schedule:
    - cron: "0 10 * * 1"    # Mondays at 10:00 UTC
  workflow_dispatch: {}

permissions:
  contents: write            # commit the refreshed export back to the repo
  id-token: write            # mint the GitHub OIDC token for Workload Identity Federation

jobs:
  search-console:
    runs-on: ubuntu-latest
    concurrency: { group: search-console, cancel-in-progress: true }
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version: 22 }

      # Keyless auth: exchange GitHub's OIDC token for a scoped Google access token.
      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.GSC_SERVICE_ACCOUNT_EMAIL }}
          token_format: access_token
          access_token_scopes: https://www.googleapis.com/auth/webmasters.readonly

      - name: Fetch Search Console performance
        run: npm run gsc
        env:
          GSC_ACCESS_TOKEN: ${{ steps.auth.outputs.access_token }}
          GSC_SITE: ${{ vars.GSC_SITE }}

      - name: Commit if changed
        run: |
          git add src/lib/search-console.json
          if git diff --cached --quiet -- src/lib/search-console.json; then
            echo "No change."; exit 0
          fi
          if git cat-file -e HEAD:src/lib/search-console.json 2>/dev/null; then
            meaningful="$(git diff --cached -U0 -- src/lib/search-console.json | grep -E '^[+-]' | grep -vE '^[+-]{3}' | grep -v '"generatedAt"')"
            if [ -z "$meaningful" ]; then
              echo "Only generatedAt changed — reverting to avoid a no-op commit."
              git restore --staged src/lib/search-console.json
              git checkout -- src/lib/search-console.json
              exit 0
            fi
          fi
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git commit -m "chore: refresh Search Console export"
          git push
