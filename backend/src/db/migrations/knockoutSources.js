import { expectedKnockoutSources } from '../../services/tournaments/helpers.js';

function rowsToObjects(result) {
  if (!result[0]) return [];
  const { columns, values } = result[0];
  return values.map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index]])));
}

export function syncKnockoutSources(db) {
  let updated = 0;
  const tournaments = rowsToObjects(db.exec('SELECT * FROM tournaments'));
  for (const tournament of tournaments) {
    if (Number(tournament.is_completed) === 1) continue;
    const rows = rowsToObjects(
      db.exec("SELECT id, code, home_source, away_source FROM tournament_schedule WHERE tournament_id = ? AND phase IN ('knockout', 'placement')", [tournament.id])
    );
    if (rows.length === 0) continue;
    const expected = expectedKnockoutSources(tournament);
    const sameStructure = rows.length === expected.size && rows.every((row) => expected.has(row.code));
    const placeholders = rows.map(() => '?').join(', ');
    const played = db.exec(
      `SELECT COUNT(*) FROM games WHERE tournament_id = ? AND (stage_type IN ('knockout', 'placement') OR schedule_code IN (${placeholders}))`,
      [tournament.id, ...rows.map((row) => row.code)]
    )[0].values[0][0];
    if (!sameStructure || played > 0) continue;

    let changed = 0;
    for (const row of rows) {
      const { home, away } = expected.get(row.code);
      const homeJson = JSON.stringify(home);
      const awayJson = JSON.stringify(away);
      if (row.home_source !== homeJson || row.away_source !== awayJson) {
        db.run('UPDATE tournament_schedule SET home_source = ?, away_source = ? WHERE id = ?', [homeJson, awayJson, row.id]);
        changed += 1;
      }
    }
    if (changed > 0) {
      console.log(`[db] Migration: KO-Paarungen für "${tournament.name}" aktualisiert (${changed} Spiele).`);
      updated += changed;
    }
  }
  return updated;
}
