import devConfig from './environments/development.json' with { type: 'json' };
import stagingConfig from './environments/staging.json' with { type: 'json' };
import prodConfig from './environments/production.json' with { type: 'json' };

const env = process.env.NODE_ENV || 'development';

export function getEnvConfig() {
  if (env === 'production') return prodConfig;
  if (env === 'staging') return stagingConfig;
  return devConfig;
}

export default getEnvConfig();
