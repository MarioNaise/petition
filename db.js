const spicedPg = require("spiced-pg");
// below we have information that we need for our connection
// which db do we talk to?
const database = "petition";
// which user is running our queries in the db?
const username = "postgres";
// whats the users password
const password = "postgres";

// const db = spicedPg(
//     `postgres:${username}:${password}@localhost:5432/${database}`
// );
const db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:${username}:${password}@localhost:5432/${database}`
);

// console.log("[db] connecting to: ", database);

module.exports.addSignature = (signatureURL, userId) => {
    const q = `INSERT INTO signatures (signature, user_id)
                VALUES ($1, $2)
                RETURNING id`;
    const param = [signatureURL, userId];
    return db.query(q, param);
};

module.exports.countSignatures = () => {
    const q = `SELECT COUNT (id) 
                FROM signatures;`;
    return db.query(q);
};

module.exports.getDataURL = (signatureId) => {
    const q = `SELECT signature 
                FROM signatures 
                WHERE id = $1;`;
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
    const q = `SELECT password, id 
                FROM users 
                WHERE email = $1`;
    const param = [email];
    return db.query(q, param);
};

module.exports.findSignature = (userId) => {
    const q = `SELECT * 
                FROM signatures 
                WHERE user_id = $1`;
    const param = [userId];
    return db.query(q, param);
};

module.exports.addUserInfo = (age, city, url, userId) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
                VALUES ($1, $2, $3, $4)`;
    const param = [age, city, url, userId];
    return db.query(q, param);
};

module.exports.getSigners = () => {
    return db.query(
        `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
        FROM users
        LEFT OUTER JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id;`
    );
};

module.exports.getSignersCity = (city) => {
    const q = `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
        FROM users
        LEFT OUTER JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id
        WHERE LOWER(user_profiles.city) = LOWER($1);`;
    const param = [city];
    return db.query(q, param);
};

module.exports.deleteSignature = (userId) => {
    const q = `DELETE FROM signatures WHERE user_id = $1;`;
    const param = [userId];
    return db.query(q, param);
};

module.exports.getProfile = (userId) => {
    const q = `SELECT users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url
                FROM users
                LEFT OUTER JOIN user_profiles
                ON users.id = user_profiles.user_id
                WHERE users.id = $1;`;
    const param = [userId];
    return db.query(q, param);
};

module.exports.editUser = (first, last, email, userId) => {
    const q = `UPDATE users
                SET first=$1, last=$2, email=$3
                WHERE id = $4;`;
    const param = [first, last, email, userId];
    return db.query(q, param);
};

module.exports.editUserPassword = (first, last, email, password, userId) => {
    const q = `UPDATE users
                SET first=$1, last=$2, email=$3, password=$4
                WHERE id = $5;`;
    const param = [first, last, email, password, userId];
    return db.query(q, param);
};

module.exports.editProfile = (age, city, url, userId) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id)
                DO UPDATE SET age = $1, city = $2, url = $3;`;
    const param = [age, city, url, userId];
    return db.query(q, param);
};
