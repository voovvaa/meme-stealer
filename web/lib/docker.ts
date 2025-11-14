/**
 * Docker utility for managing bot container
 */

import Docker from "dockerode";
import { logger } from "./logger";

const BOT_CONTAINER_NAME = "meme-stealer-bot";

let dockerInstance: Docker | null = null;

/**
 * Get Docker instance (singleton)
 */
export function getDocker(): Docker {
  if (!dockerInstance) {
    dockerInstance = new Docker({ socketPath: "/var/run/docker.sock" });
  }
  return dockerInstance;
}

/**
 * Get bot container instance
 */
export async function getBotContainer() {
  const docker = getDocker();
  try {
    const container = docker.getContainer(BOT_CONTAINER_NAME);
    // Verify container exists
    await container.inspect();
    return container;
  } catch (error) {
    logger.error({ error, containerName: BOT_CONTAINER_NAME }, "Failed to get bot container");
    throw new Error(`Container ${BOT_CONTAINER_NAME} not found`);
  }
}

/**
 * Check if Docker is available
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    const docker = getDocker();
    await docker.ping();
    return true;
  } catch (error) {
    logger.error({ error }, "Docker is not available");
    return false;
  }
}
