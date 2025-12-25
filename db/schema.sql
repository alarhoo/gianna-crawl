CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  subtitle TEXT,
  releaseDate TEXT,
  studio TEXT,
  series TEXT,
  director TEXT,
  actors TEXT,
  tags TEXT,
  thumbnailSrcSet TEXT,
  previewIframeUrl TEXT,
  hoverPreviewM3U8 TEXT,
  fileName TEXT,
	sourceTabTitle TEXT,
  detailUrl TEXT UNIQUE
);
