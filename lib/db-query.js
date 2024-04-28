const config = require("./config");
const { Client } = require("pg");
const isProduction = (config.NODE_ENV === "production");

const CONNECTION = {
  connectionString: config.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
}

async function dbQuery(statement, ...parameters) {
  let client = new Client(CONNECTION);

  await client.connect();
  let results = await client.query(statement, parameters);
  await client.end();
  
  return results;
}

module.exports = dbQuery;