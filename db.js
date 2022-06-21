const spicedPg = require("spiced-pg");
// below we have information that we need for our connection
// which db do we talk to?
const database = "petition";
// which user is running our queries in the db?
const username = "postgres";
// whats the users password
const password = "postgres";

const db = spicedPg(
    `postgres:${username}:${password}@localhost:5432/${database}`
);

// console.log("[db] connecting to: ", database);

module.exports.getSignatures = () => {
    return db.query(`SELECT * FROM signatures`);
};

module.exports.addSignature = (firstName, lastName, signatureURL) => {
    const q = `INSERT INTO signatures (first, last, signature)
    VALUES ($1, $2, $3)
    RETURNING id`;
    const param = [firstName, lastName, signatureURL];
    return db.query(q, param);
};

module.exports.countSignatures = () => {
    const q = `SELECT COUNT (id) FROM signatures;`;
    return db.query(q);
};

module.exports.getDataURL = (signatureId) => {
    const q = `SELECT signature FROM signatures WHERE id = $1;`;
    const param = [signatureId];
    return db.query(q, param);
};
