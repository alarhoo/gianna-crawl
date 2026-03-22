CREATE TABLE IF NOT EXISTS scenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- ---------------------------------
  -- Source identity (important)
  -- ---------------------------------
  sourceSite TEXT NOT NULL,                 -- 'siteB'
  performerId TEXT NOT NULL,                -- 1398
  performerSlug TEXT NOT NULL,              -- lisa-ann
  sourceSceneUrl TEXT NOT NULL UNIQUE,
  sourceMovieUrl TEXT,

  -- ---------------------------------
  -- Core searchable fields
  -- ---------------------------------
  title TEXT,
  movieTitle TEXT,
  studio TEXT,
  series TEXT,

  releaseDate TEXT,                         -- YYYY-MM-DD
  productionYear INTEGER,
  videoLengthMinutes INTEGER,

  -- ---------------------------------
  -- Media status flags
  -- ---------------------------------
  trailerStatus TEXT,                       -- success | failed | null
  trailerLastError TEXT,

  -- ---------------------------------
  -- Canonical payload
  -- ---------------------------------
  sceneData JSON NOT NULL,                  -- full CanonicalScene object

  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
