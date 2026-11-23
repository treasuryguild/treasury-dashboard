import type { Config, Handler } from "@netlify/functions";
import { syncAllProjects } from "../../lib/onchain/syncProjects";

function authorized(event: {
  headers?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined> | null;
}): boolean {
  const secret = process.env.CRON_SECRET;
  // Scheduled Netlify invocations have no caller secret; allow when CRON_SECRET unset
  // or when header/query matches. Manual invokes must supply the secret when set.
  if (!secret) return true;

  const header =
    event.headers?.["x-cron-secret"] ||
    event.headers?.["X-Cron-Secret"] ||
    "";
  const query = event.queryStringParameters?.secret || "";
  // Netlify scheduled runs include `x-netlify-event: schedule` / user-agent patterns
  const isScheduled =
    event.headers?.["x-netlify-event"] === "schedule" ||
    event.headers?.["X-Netlify-Event"] === "schedule";

  if (isScheduled) return true;
  return header === secret || query === secret;
}

export const handler: Handler = async (event) => {
  try {
    if (!authorized(event)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    const dryRun =
      process.env.DRY_RUN === "true" ||
      event.queryStringParameters?.dryRun === "true";

    const result = await syncAllProjects({ dryRun });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "On-chain sync completed",
        result,
      }),
    };
  } catch (error: any) {
    console.error("syncOnchainTransactions failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "On-chain sync failed",
        error: error?.message || String(error),
      }),
    };
  }
};

export const config: Config = {
  schedule: "@hourly",
};
