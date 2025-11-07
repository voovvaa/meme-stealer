import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Ensure directory exists for file
 */
function ensureDirectoryForFile(filePath: string): void {
  const dirname = path.dirname(filePath);
  try {
    mkdirSync(dirname, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

/**
 * Database connection options
 */
export interface DatabaseOptions {
  path?: string;
  readonly?: boolean;
  verbose?: boolean;
  logger?: {
    info: (obj: unknown, msg?: string) => void;
    error: (obj: unknown, msg?: string) => void;
  };
}

/**
 * Singleton database connection manager
 */
class DatabaseConnection {
  private static instance: ReturnType<typeof Database> | null = null;
  private static options: DatabaseOptions = {};
  private static initialized = false;

  /**
   * Initialize and get database instance
   */
  public static getInstance(options: DatabaseOptions = {}): ReturnType<typeof Database> {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.options = options;
      DatabaseConnection.instance = DatabaseConnection.createConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Create new database connection
   */
  private static createConnection(): ReturnType<typeof Database> {
    const dbPath = DatabaseConnection.options.path ||
                   process.env.MEME_DB_PATH ||
                   path.join(process.cwd(), "sessions", "memes.sqlite");

    ensureDirectoryForFile(dbPath);

    const db = new Database(dbPath, {
      readonly: DatabaseConnection.options.readonly ?? false,
      fileMustExist: false,
      verbose: DatabaseConnection.options.verbose ? console.log : undefined,
    });

    // Enable WAL mode for better performance
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("cache_size = 10000");
    db.pragma("temp_store = MEMORY");

    DatabaseConnection.options.logger?.info(
      { path: dbPath },
      "Database connected"
    );

    return db;
  }

  /**
   * Mark database as initialized
   */
  public static markInitialized(): void {
    DatabaseConnection.initialized = true;
  }

  /**
   * Check if database is initialized
   */
  public static isInitialized(): boolean {
    return DatabaseConnection.initialized;
  }

  /**
   * Close database connection
   */
  public static close(): void {
    if (DatabaseConnection.instance) {
      try {
        DatabaseConnection.instance.close();
        DatabaseConnection.options.logger?.info({}, "Database closed");
      } catch (error) {
        DatabaseConnection.options.logger?.error(
          { err: error },
          "Error closing database"
        );
      } finally {
        DatabaseConnection.instance = null;
        DatabaseConnection.initialized = false;
      }
    }
  }

  /**
   * Check if database is connected
   */
  public static isConnected(): boolean {
    try {
      if (!DatabaseConnection.instance) {
        return false;
      }
      DatabaseConnection.instance.prepare("SELECT 1").get();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Get database instance
 */
export const getDatabase = (options?: DatabaseOptions): ReturnType<typeof Database> => {
  return DatabaseConnection.getInstance(options);
};

/**
 * Close database connection
 */
export const closeDatabase = (): void => {
  DatabaseConnection.close();
};

/**
 * Check if database is connected
 */
export const isDatabaseConnected = (): boolean => {
  return DatabaseConnection.isConnected();
};

/**
 * Check if database is initialized
 */
export const isDatabaseInitialized = (): boolean => {
  return DatabaseConnection.isInitialized();
};

/**
 * Mark database as initialized
 */
export const markDatabaseInitialized = (): void => {
  DatabaseConnection.markInitialized();
};
