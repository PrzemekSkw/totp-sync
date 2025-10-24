// Database adapter router - wybiera właściwy adapter na podstawie .env

const DATABASE_TYPE = process.env.DATABASE_TYPE || 'postgresql';

let adapter;

if (DATABASE_TYPE === 'sqlite') {
  adapter = require('./adapters/sqlite');
} else if (DATABASE_TYPE === 'postgresql') {
  adapter = require('./adapters/postgresql');
} else {
  throw new Error(`Unsupported DATABASE_TYPE: ${DATABASE_TYPE}. Use 'postgresql' or 'sqlite'`);
}

console.log(`📊 Using ${DATABASE_TYPE.toUpperCase()} database`);

module.exports = adapter;
