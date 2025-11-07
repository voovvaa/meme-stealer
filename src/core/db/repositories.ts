/**
 * Singleton instances of repositories from @meme-stealer/shared package
 *
 * This file creates and exports singleton instances of repositories
 * for use throughout the bot application.
 */
import {
  ConfigRepository,
  ChannelRepository,
  KeywordRepository,
  MemeRepository,
} from "@meme-stealer/shared";

import { getDatabase } from "./database.js";

const db = getDatabase();

/**
 * Config repository singleton
 */
export const configRepository = new ConfigRepository(db);

/**
 * Channel repository singleton
 */
export const channelRepository = new ChannelRepository(db);

/**
 * Keyword repository singleton
 */
export const keywordRepository = new KeywordRepository(db);

/**
 * Meme repository singleton
 */
export const memeRepository = new MemeRepository(db);
