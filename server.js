const express = require("express");
const app = express();
const db = require("./db");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const bcrypt = require("./bcrypt");

const COOKIE_SECRET =
    process.env.COOKIE_SECRET || require("./secrets.json").COOKIE_SECRET;

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(
    cookieSession({
        secret: COOKIE_SECRET,
        maxAge: 1000 * 60 * 60 * 24 * 14,
        sameSite: true,
    })
);

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(express.static("./public"));

// redirect from / to /register
app.get("/", (req, res) => {
    res.redirect("/register");
});

app.get("/petition", (req, res) => {
    if (req.session.login != true) {
        //console.log("petition 1");
        res.redirect("/register");
    } else {
        if (req.session.signed != true) {
            res.render("petition", {});
        } else {
            res.redirect("/thanks");
        }
    }
});

app.post("/petition", (req, res) => {
    // console.log("running POST /add-signature", req.body.signature);
    db.addSignature(req.body.signature, req.session.user_id)
        .then((result) => {
            // console.log(result.rows);
            req.session.signed = true;
            req.session.signatureId = result.rows[0].id;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("err in addSignature: ", err);
            res.render("petition", {
                error: true,
            });
        });
});

app.get("/thanks", (req, res) => {
    let dataUrl;
    //console.log("step1 ", req.session.signatureId); ////////////////////
    db.getDataURL(req.session.signatureId)
        .then((result) => {
            //console.log("step2 ", req.session.signatureId); ////////////////
            dataUrl = result.rows[0].signature;
        })
        .catch((err) => {
            // console.log("Error in db.getDataURL", err);
        });

    db.countSignatures()
        .then((result) => {
            req.session.numSignatures = result.rows[0].count;
            if (req.session.signed) {
                res.render("thanks", {
                    data: {
                        url: dataUrl,
                        numSignatures: req.session.numSignatures,
                    },
                });
            } else {
                res.redirect("/petition");
            }
        })
        .catch((err) => {
            // console.log("Error in db.countSignatures", err);
        });
});

app.get("/signers", (req, res) => {
    // console.log("running GET /signs");
    if (req.session.signed) {
        db.getSignatures()
            .then((result) => {
                // console.log("result.rows from getSignatures", result.rows);
                res.render("signers", {
                    results: result.rows,
                });
            })
            .catch((err) => {
                // console.log("Error in db.getSignatures", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/register", (req, res) => {
    if (req.session.login) {
        res.redirect("/petition");
    } else {
        res.render("register", {});
    }
});

app.post("/register", (req, res) => {
    bcrypt
        .hash(req.body.password)
        .then((hash) => {
            db.addUser(
                req.body.firstName,
                req.body.lastName,
                req.body.email,
                hash
            )
                .then((result) => {
                    req.session.user_id = result.rows[0].id;
                    req.session.login = true;
                    res.redirect("/petition");
                })
                .catch((err) => {
                    // console.log("err in addUser: ", err);
                    res.render("register", {
                        error: true,
                    });
                });
        })
        .catch((err) => {
            console.log("error in bcrypt /register", err);
        });
});

app.get("/login", (req, res) => {
    res.render("login", {});
});

app.post("/login", (req, res) => {
    // console.log("req.body.password: ", req.body.password);
    db.login(req.body.email)
        .then((result) => {
            // console.log("returned password: ", result.rows[0].password);
            if (result.rows[0]) {
                bcrypt
                    .compare(req.body.password, result.rows[0].password)
                    .then((isCorrect) => {
                        if (isCorrect) {
                            req.session.login = true;
                            req.session.user_id = result.rows[0].id;

                            db.findSignature(req.session.user_id)
                                .then((result) => {
                                    // console.log(result.rows);
                                    if (result.rows[0]) {
                                        req.session.signed = true;
                                        req.session.signatureId =
                                            result.rows[0].id;
                                        res.redirect("/thanks");
                                    } else {
                                        res.redirect("/petition");
                                    }
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                            // res.redirect("/petition");
                            // console.log("Correct!");
                        } else {
                            console.log("Wrong!");
                            res.render("login", {
                                error: true,
                            });
                        }
                    });
            } else {
                res.render("login", {
                    error: true,
                });
            }
        })
        .catch((err) => {
            console.log("err in login", err);
        });
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.render("logout", {});
});

app.listen(process.env.PORT || 8080, () => {
    console.log("Server is listening on...");
    console.log("PORT: ", process.env.PORT || 8080);
});
