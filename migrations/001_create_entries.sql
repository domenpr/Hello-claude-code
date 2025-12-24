-- Health Tracker Entries Table
-- Tabela za shranjevanje zdravstvenih podatkov uporabnika

CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  stress INTEGER NOT NULL CHECK (stress >= 1 AND stress <= 5),
  stomach_pain INTEGER NOT NULL CHECK (stomach_pain >= 1 AND stomach_pain <= 5),
  stool INTEGER NOT NULL CHECK (stool >= 1 AND stool <= 5),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index za hitrejše iskanje po časovnem obdobju
CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp DESC);

-- Komentar tabele
COMMENT ON TABLE entries IS 'Zdravstveni vnosi uporabnika s časovnimi oznakami';
COMMENT ON COLUMN entries.energy IS 'Energija (1-5, kjer 5 pomeni največ energije)';
COMMENT ON COLUMN entries.mood IS 'Razpoloženje (1-5, kjer 5 pomeni najboljše razpoloženje)';
COMMENT ON COLUMN entries.stress IS 'Stres (1-5, kjer 5 pomeni največ stresa)';
COMMENT ON COLUMN entries.stomach_pain IS 'Bolečina v trebuhu (1-5, kjer 5 pomeni najhujšo bolečino)';
COMMENT ON COLUMN entries.stool IS 'Blato (1-5, kjer 4 pomeni idealno)';
COMMENT ON COLUMN entries.note IS 'Opombe in dodatni komentarji';
