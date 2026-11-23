import axios from "axios";

const REPO_OWNER = "treasuryguild";
const REPO_NAME = "treasury-system-v4";
const MAIN_BRANCH = "main";

export async function commitFileToGitHub(args: {
  filePath: string;
  fileContent: string;
  commitMessage?: string;
}): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN");
  }

  const { filePath, fileContent } = args;
  const commitMessage = args.commitMessage || "Auto-capture transaction";
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
  };
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

  const latestCommitRes = await axios.get(
    `${apiUrl}/git/ref/heads/${MAIN_BRANCH}`,
    { headers }
  );
  const latestCommitSha = latestCommitRes.data.object.sha;

  const latestCommitTreeRes = await axios.get(
    `${apiUrl}/git/trees/${latestCommitSha}`,
    { headers }
  );
  const latestCommitTreeSha = latestCommitTreeRes.data.sha;

  const blobRes = await axios.post(
    `${apiUrl}/git/blobs`,
    { content: fileContent, encoding: "utf-8" },
    { headers }
  );
  const blobSha = blobRes.data.sha;

  const newTreeRes = await axios.post(
    `${apiUrl}/git/trees`,
    {
      base_tree: latestCommitTreeSha,
      tree: [
        {
          path: filePath,
          mode: "100644",
          type: "blob",
          sha: blobSha,
        },
      ],
    },
    { headers }
  );
  const newTreeSha = newTreeRes.data.sha;

  const newCommitRes = await axios.post(
    `${apiUrl}/git/commits`,
    {
      message: commitMessage,
      parents: [latestCommitSha],
      tree: newTreeSha,
    },
    { headers }
  );
  const newCommitSha = newCommitRes.data.sha;

  await axios.patch(
    `${apiUrl}/git/refs/heads/${MAIN_BRANCH}`,
    { sha: newCommitSha },
    { headers }
  );
}

export function rawGithubUrl(filePath: string): string {
  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${MAIN_BRANCH}/${filePath}`;
}
