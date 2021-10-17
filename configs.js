const dotenv = require('dotenv');

module.exports = async ({ options, resolveConfigurationProperty }) => {
  const envVars = dotenv.config({ path: options.stage === 'prod' ? '.env.prod' : '.env' }).parsed;

  return Object.assign(
    {},
    envVars, 
    process.env
  );
};