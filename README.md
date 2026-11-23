### Treasury Dashboard

This is the current dashboard where contributors can go to view their rewards and status of wallets in their organization.

[https://treasuryguild.com](https://treasuryguild.com)

## On-chain auto-capture (Netlify cron)

Hourly Netlify scheduled function `syncOnchainTransactions` scans all **non-archived** projects that have a wallet, classifies new transactions (incoming, staking, swaps, votes, smart contracts, etc.), writes Supabase rows (`transactions` / `contributions` / `distributions`), and commits metadata JSON to `treasuryguild/treasury-system-v4` (same layout the dashboard already links via `tx_json_url`).

It **skips**:
- hashes already in `transactions`
- on-chain label **674** metadata that looks like treasury-dapp bulk builder output (`mdVersion` 1.8 or contributions with `arrayMap`)

Smart-contract txs get a `contractInfo` block in `tx_json` and a **Smart Contract** panel on the per-tx page (`/api/getTxContractInfo`).

### Netlify environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `KOIOS_API_KEY` | Yes | Chain reads (already used for balances) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (cron) | Inserts from the sync function |
| `GITHUB_TOKEN` | Yes (cron) | Commit metadata to `treasury-system-v4` |
| `CRON_SECRET` | Recommended | Required for manual HTTP invokes (`x-cron-secret` header or `?secret=`) |
| `DRY_RUN` | No | `true` = classify/log only, no DB/GitHub writes |
| `BLOCKFROST_API_KEY_MAINNET` | No | Optional script JSON enrichment |

### Manual trigger

```bash
curl -X POST "https://<your-site>/.netlify/functions/syncOnchainTransactions?secret=<CRON_SECRET>"
# dry run:
curl -X POST "https://<your-site>/.netlify/functions/syncOnchainTransactions?secret=<CRON_SECRET>&dryRun=true"
```
