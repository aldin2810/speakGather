const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'speakgather',
    password: 'aldin2810',
    port: 5432,
    idleTimeoutMillis: 30000,
});
module.exports = pool;
