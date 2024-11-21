import * as migration_20241121_170732 from './20241121_170732';
import * as migration_20241121_193501 from './20241121_193501';

export const migrations = [
  {
    up: migration_20241121_170732.up,
    down: migration_20241121_170732.down,
    name: '20241121_170732',
  },
  {
    up: migration_20241121_193501.up,
    down: migration_20241121_193501.down,
    name: '20241121_193501'
  },
];
