/**
 * Repositories for web interface
 * Uses shared package repositories with web-specific database connection
 */

import {
  ConfigRepository,
  ChannelRepository,
  KeywordRepository,
  StatsRepository,
  type Config,
  type ConfigInput,
  type SourceChannel,
  type SourceChannelInput,
  type FilterKeyword,
  type FilterKeywordInput,
  type MemeStats,
  type Post,
  type QueueItem,
} from "@meme-stealer/shared";
import { getDb } from "./db";

// Re-export types for backward compatibility
export type {
  Config,
  ConfigInput,
  SourceChannel,
  SourceChannelInput,
  FilterKeyword,
  FilterKeywordInput,
  MemeStats,
  Post,
  QueueItem,
};

// Lazy initialization to avoid database connection during build
let _configRepository: ConfigRepository | null = null;
let _sourceChannelsRepository: ChannelRepository | null = null;
let _filterKeywordsRepository: KeywordRepository | null = null;
let _statsRepository: StatsRepository | null = null;

export const configRepository = {
  get getConfig() {
    if (!_configRepository) {
      _configRepository = new ConfigRepository(getDb());
    }
    return _configRepository.getConfig.bind(_configRepository);
  },
  get saveConfig() {
    if (!_configRepository) {
      _configRepository = new ConfigRepository(getDb());
    }
    return _configRepository.saveConfig.bind(_configRepository);
  },
  get setNeedsReload() {
    if (!_configRepository) {
      _configRepository = new ConfigRepository(getDb());
    }
    return _configRepository.setNeedsReload.bind(_configRepository);
  },
  get clearNeedsReload() {
    if (!_configRepository) {
      _configRepository = new ConfigRepository(getDb());
    }
    return _configRepository.clearNeedsReload.bind(_configRepository);
  },
};

export const sourceChannelsRepository = {
  get getAll() {
    if (!_sourceChannelsRepository) {
      _sourceChannelsRepository = new ChannelRepository(getDb());
    }
    return _sourceChannelsRepository.getAll.bind(_sourceChannelsRepository);
  },
  get getEnabled() {
    if (!_sourceChannelsRepository) {
      _sourceChannelsRepository = new ChannelRepository(getDb());
    }
    return _sourceChannelsRepository.getEnabled.bind(_sourceChannelsRepository);
  },
  get add() {
    if (!_sourceChannelsRepository) {
      _sourceChannelsRepository = new ChannelRepository(getDb());
    }
    return _sourceChannelsRepository.add.bind(_sourceChannelsRepository);
  },
  get update() {
    if (!_sourceChannelsRepository) {
      _sourceChannelsRepository = new ChannelRepository(getDb());
    }
    return _sourceChannelsRepository.update.bind(_sourceChannelsRepository);
  },
  get archive() {
    if (!_sourceChannelsRepository) {
      _sourceChannelsRepository = new ChannelRepository(getDb());
    }
    return _sourceChannelsRepository.archive.bind(_sourceChannelsRepository);
  },
  get unarchive() {
    if (!_sourceChannelsRepository) {
      _sourceChannelsRepository = new ChannelRepository(getDb());
    }
    return _sourceChannelsRepository.unarchive.bind(_sourceChannelsRepository);
  },
  get delete() {
    if (!_sourceChannelsRepository) {
      _sourceChannelsRepository = new ChannelRepository(getDb());
    }
    return _sourceChannelsRepository.delete.bind(_sourceChannelsRepository);
  },
};

export const filterKeywordsRepository = {
  get getAll() {
    if (!_filterKeywordsRepository) {
      _filterKeywordsRepository = new KeywordRepository(getDb());
    }
    return _filterKeywordsRepository.getAll.bind(_filterKeywordsRepository);
  },
  get getEnabled() {
    if (!_filterKeywordsRepository) {
      _filterKeywordsRepository = new KeywordRepository(getDb());
    }
    return _filterKeywordsRepository.getEnabled.bind(_filterKeywordsRepository);
  },
  get add() {
    if (!_filterKeywordsRepository) {
      _filterKeywordsRepository = new KeywordRepository(getDb());
    }
    return _filterKeywordsRepository.add.bind(_filterKeywordsRepository);
  },
  get update() {
    if (!_filterKeywordsRepository) {
      _filterKeywordsRepository = new KeywordRepository(getDb());
    }
    return _filterKeywordsRepository.update.bind(_filterKeywordsRepository);
  },
  get archive() {
    if (!_filterKeywordsRepository) {
      _filterKeywordsRepository = new KeywordRepository(getDb());
    }
    return _filterKeywordsRepository.archive.bind(_filterKeywordsRepository);
  },
  get unarchive() {
    if (!_filterKeywordsRepository) {
      _filterKeywordsRepository = new KeywordRepository(getDb());
    }
    return _filterKeywordsRepository.unarchive.bind(_filterKeywordsRepository);
  },
  get delete() {
    if (!_filterKeywordsRepository) {
      _filterKeywordsRepository = new KeywordRepository(getDb());
    }
    return _filterKeywordsRepository.delete.bind(_filterKeywordsRepository);
  },
};

export const statsRepository = {
  get getMemeStats() {
    if (!_statsRepository) {
      _statsRepository = new StatsRepository(getDb());
    }
    return _statsRepository.getMemeStats.bind(_statsRepository);
  },
  get getChannelStats() {
    if (!_statsRepository) {
      _statsRepository = new StatsRepository(getDb());
    }
    return _statsRepository.getChannelStats.bind(_statsRepository);
  },
  get getTimelineStats() {
    if (!_statsRepository) {
      _statsRepository = new StatsRepository(getDb());
    }
    return _statsRepository.getTimelineStats.bind(_statsRepository);
  },
  get getGalleryPosts() {
    if (!_statsRepository) {
      _statsRepository = new StatsRepository(getDb());
    }
    return _statsRepository.getGalleryPosts.bind(_statsRepository);
  },
  get getGalleryPostsCount() {
    if (!_statsRepository) {
      _statsRepository = new StatsRepository(getDb());
    }
    return _statsRepository.getGalleryPostsCount.bind(_statsRepository);
  },
  get getPosts() {
    if (!_statsRepository) {
      _statsRepository = new StatsRepository(getDb());
    }
    return _statsRepository.getPosts.bind(_statsRepository);
  },
  get getPostsCount() {
    if (!_statsRepository) {
      _statsRepository = new StatsRepository(getDb());
    }
    return _statsRepository.getPostsCount.bind(_statsRepository);
  },
  get getQueuedPosts() {
    if (!_statsRepository) {
      _statsRepository = new StatsRepository(getDb());
    }
    return _statsRepository.getQueuedPosts.bind(_statsRepository);
  },
  get getQueuedPostsCount() {
    if (!_statsRepository) {
      _statsRepository = new StatsRepository(getDb());
    }
    return _statsRepository.getQueuedPostsCount.bind(_statsRepository);
  },
};
