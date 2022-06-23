const bcrypt = require("./bcrypt");

bcrypt
    .hash("letmein")
    .then((hash) => {
        console.log(hash);
        return bcrypt.compare("letmein", hash);
    })
    .then((isCorrect) => {
        if (isCorrect) {
            console.log("Correct!");
        } else {
            console.log("Wrong!");
        }
    });
