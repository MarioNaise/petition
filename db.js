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
    return db.query(`SELECT sign FROM signatures`);
};

module.exports.addSignature = (signatureURL, user_id) => {
    const q = `INSERT INTO signatures (signature, user_id)
    VALUES ($1, $2)
    RETURNING id`;
    const param = [signatureURL, user_id];
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

module.exports.addUser = (first, last, email, password) => {
    const q = `INSERT INTO users (first, last, email, password)
                VALUES ($1, $2, $3, $4)
                RETURNING id`;
    const param = [first, last, email, password];
    return db.query(q, param);
};

module.exports.login = (email) => {
    const q = `SELECT password, id FROM users WHERE email = $1`;
    const param = [email];
    return db.query(q, param);
};

module.exports.findSignature = (user_id) => {
    const q = `SELECT * FROM signatures WHERE user_id = $1`;
    const param = [user_id];
    return db.query(q, param);
};

// SELECT that find a row in the users table by email address

// SELECT that fins a signature id in the signatures table by the user_id
// This query will not be needed after tomorrow so you may want to skip it
// if you are short of time
