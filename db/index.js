import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export const db = await open({
  filename: 'videos.db',
  driver: sqlite3.Database,
})

await db.exec(await import('fs').then((fs) => fs.promises.readFile('./db/schema.sql', 'utf8')))
