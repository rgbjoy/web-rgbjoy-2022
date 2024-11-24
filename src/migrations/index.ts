import * as migration_20241121_170732 from './20241121_170732';
import * as migration_20241121_193501 from './20241121_193501';
import * as migration_20241122_023601 from './20241122_023601';
import * as migration_20241122_151432 from './20241122_151432';
import * as migration_20241123_232920 from './20241123_232920';
import * as migration_20241124_013022 from './20241124_013022';
import * as migration_20241124_014246 from './20241124_014246';

export const migrations = [
  {
    up: migration_20241121_170732.up,
    down: migration_20241121_170732.down,
    name: '20241121_170732',
  },
  {
    up: migration_20241121_193501.up,
    down: migration_20241121_193501.down,
    name: '20241121_193501',
  },
  {
    up: migration_20241122_023601.up,
    down: migration_20241122_023601.down,
    name: '20241122_023601',
  },
  {
    up: migration_20241122_151432.up,
    down: migration_20241122_151432.down,
    name: '20241122_151432',
  },
  {
    up: migration_20241123_232920.up,
    down: migration_20241123_232920.down,
    name: '20241123_232920',
  },
  {
    up: migration_20241124_013022.up,
    down: migration_20241124_013022.down,
    name: '20241124_013022',
  },
  {
    up: migration_20241124_014246.up,
    down: migration_20241124_014246.down,
    name: '20241124_014246'
  },
];
