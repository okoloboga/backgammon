export default () => ({
  port: 3000,
  ton: {
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: undefined,
    network: 'mainnet',
  },
  database: {
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'password',
    database: 'backgammon',
  },
  jwt: {
    secret: 'your-secret-key',
    expiresIn: '24h',
  },
}); 