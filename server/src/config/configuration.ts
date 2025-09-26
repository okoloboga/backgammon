export default () => ({
  port: parseInt(process.env.PORT || '3000'),
  ton: {
    endpoint:
      process.env.TON_ENDPOINT || 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: process.env.TON_API_KEY,
    network: process.env.TON_NETWORK || 'mainnet',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'backgammon',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
});
