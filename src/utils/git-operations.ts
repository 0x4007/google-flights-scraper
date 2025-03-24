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
  iteration: number
): Promise<boolean> {
  try {
    // Add all files
    await execAsync("git add .");

    // Create commit with iteration number and message
    const commitMessage = `[Iteration ${iteration}] ${message}`;
    await execAsync(`git commit -m "${commitMessage}"`);

    console.log(`Successfully committed: ${commitMessage}`);
    return true;
  } catch (error) {
    console.error("Failed to commit changes:", error);
    return false;
  }
}
