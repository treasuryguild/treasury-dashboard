import { syncAllProjects } from "../lib/onchain/syncProjects";

async function main() {
  const dryRun =
    process.env.DRY_RUN === "true" ||
    process.argv.includes("--dry-run");

  console.log(`Starting on-chain sync CLI (dryRun=${dryRun})`);

  const result = await syncAllProjects({ dryRun });

  console.log(JSON.stringify(result, null, 2));

  if (result.totals.errors > 0) {
    console.error(
      `Sync finished with ${result.totals.errors} error(s)`
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("sync-onchain failed:", error);
  process.exit(1);
});
