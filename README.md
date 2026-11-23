### Treasury Dashboard

This is the current dashboard where contributors can go to view their rewards and status of wallets in their organization.

[https://treasuryguild.com](https://treasuryguild.com)

## On-chain auto-capture (GitHub Actions)

Hourly GitHub Actions workflow [`.github/workflows/sync-onchain.yml`](.github/workflows/sync-onchain.yml) runs `npm run sync:onchain`. It scans all **non-archived** projects that have a wallet, classifies new transactions (incoming, staking, swaps, votes, smart contracts, etc.), writes Supabase rows (`transactions` / `contributions` / `distributions`), and commits metadata JSON to `treasuryguild/treasury-system-v4` (same layout the dashboard already links via `tx_json_url`).

It **skips**:
- hashes already in `transactions`
- on-chain label **674** metadata that looks like treasury-dapp bulk builder output (`mdVersion` 1.8 or contributions with `arrayMap`)

Smart-contract txs get a `contractInfo` block in `tx_json` and a **Smart Contract** panel on the per-tx page (`/api/getTxContractInfo`).

### GitHub repository secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Inserts from the sync job |
| `KOIOS_API_KEY` | Yes | Chain reads |
| `TREASURY_SYSTEM_GITHUB_TOKEN` | Yes | PAT with write access to `treasuryguild/treasury-system-v4` (mapped to `GITHUB_TOKEN` in the job) |
| `BLOCKFROST_API_KEY_MAINNET` | No | Optional script JSON enrichment |
| `DRY_RUN` | No | Set to `true` to classify/log only on scheduled runs |

Also used by the Next.js app (Netlify / local): `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `KOIOS_API_KEY`.

### Manual trigger

1. GitHub → **Actions** → **Sync on-chain transactions** → **Run workflow**
2. Optionally enable **dry_run** to classify without DB/GitHub writes

Or locally (with the same env vars set):

```bash
npm run sync:onchain:dry
npm run sync:onchain
```
