import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Gets the current git commit hash
 * @returns The commit hash or error message if failed
 */
export async function getCurrentGitCommit(): Promise<string> {
  try {
    const { stdout } = await execAsync("git rev-parse HEAD");
    return stdout.trim();
  } catch (error) {
    console.error("Failed to get git commit hash:", error);
    return "unknown-commit";
  }
}

/**
 * Adds all changed files to git and creates a commit
 * @param message The commit message
 * @param iteration The iteration number to include in the commit message
 * @returns True if successful, false otherwise
 */
export async function commitChanges(
  message: string,
  iteration: number,
): Promise<boolean> {
  try {
    // Add all files
    await execAsync("git add .");

    // Check if there are changes to commit
    const { stdout } = await execAsync("git status --porcelain");

    // If there are no changes, return true without attempting to commit
    if (!stdout.trim()) {
      console.log("No changes to commit, working tree clean");
      return true;
    }

    // Create commit with message (don't add iteration if it's already in the message)
    const commitMessage = message.includes(`[Iteration ${iteration}]`) ? message : `[Iteration ${iteration}] ${message}`;
    await execAsync(`git commit -m "${commitMessage}"`);

    console.log(`Successfully committed: ${commitMessage}`);
    return true;
  } catch (error) {
    console.error("Failed to commit changes:", error);
    return false;
  }
}
