const dotenv = require('dotenv');

module.exports = async ({ options, resolveConfigurationProperty }) => {
  const envVars = dotenv.config({ path: options.stage === 'prod' ? '.env.prod' : '.env' }).parsed;
  console.log('envVars', envVars);
  return Object.assign(
    {},
    envVars,      // `dotenv` environment variables
    process.env   // system environment variables
  );
};