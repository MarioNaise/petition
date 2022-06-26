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

//////////////////////////////////////////////////////////////
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

////////////////////    HOME     /////////////////////////////////
app.get("/", (req, res) => {
    res.redirect("/register");
});

/////////////////   PETITION     /////////////////////////////////
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
    db.addSignature(req.body.signature, req.session.userId)
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

///////////////////////    THANKS      ////////////////////////////////
app.get("/thanks", (req, res) => {
    let dataUrl;
    db.getDataURL(req.session.signatureId)
        .then((result) => {
            dataUrl = result.rows[0].signature;
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
        })
        .catch((err) => {
            // console.log("Error in db.getDataURL", err);
        });
});

app.post("/thanks", (req, res) => {
    db.deleteSignature(req.session.userId)
        .then((result) => {
            req.session.signed = false;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("err in deleteSignature", err);
        });
});

/////////////////    REGISTER    ////////////////////////////////
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
                    req.session.userId = result.rows[0].id;
                    req.session.login = true;
                    res.redirect("/profile");
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

/////////////////////   PROFILE     /////////////////////////////////
app.get("/profile", (req, res) => {
    res.render("profile", {});
});

app.post("/profile", (req, res) => {
    if (
        req.body.age === "" &&
        req.body.city === "" &&
        req.body.website === ""
    ) {
        res.redirect("/petition");
    } else {
        let url = req.body.website;

        if (
            !url.startsWith("http://") &&
            !url.startsWith("https://") &&
            !url.startsWith("//")
        ) {
            url = "";
        }
        db.addUserInfo(req.body.age, req.body.city, url, req.session.userId)
            .then((result) => {
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("err in addUserInfo ", err);
                res.render("profile", {
                    error: true,
                });
            });
    }
});

///////////////////    LOGIN         /////////////////////////////
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
                            req.session.userId = result.rows[0].id;

                            db.findSignature(req.session.userId)
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

///////////////////     SIGNERS       //////////////////////////////////
app.get("/signers", (req, res) => {
    // console.log("running GET /signs");
    if (req.session.signed) {
        db.getSigners()
            .then((result) => {
                // console.log("result.rows from getSigners", result.rows);
                res.render("signers", {
                    results: result.rows,
                });
            })
            .catch((err) => {
                console.log("Error in db.getSigners", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers/:city", (req, res) => {
    let city = req.params.city.toLocaleLowerCase();
    if (req.session.signed) {
        db.getSignersCity(city)
            .then((result) => {
                // console.log("result.rows from getSignersCity", result.rows);
                res.render("signers", {
                    results: result.rows,
                });
            })
            .catch((err) => {
                console.log("Error in db.getSignersCity", err);
            });
    } else {
        res.redirect("/petition");
    }
});

///////////////////    EDIT PROFILE    /////////////////////////////
app.get("/profile/edit", (req, res) => {
    db.getProfile(req.session.userId)
        .then((result) => {
            console.log(result.rows);
            res.render("editProfile", {
                results: result.rows,
            });
        })
        .catch((err) => {
            console.log("err in getProfile", err);
        });
});

//////////////////    LOGOUT       ////////////////////////////
app.get("/logout", (req, res) => {
    req.session = null;
    res.render("logout", {});
});

////////////////////    SERVER        ////////////////////////////////
app.listen(process.env.PORT || 8080, () => {
    console.log("Server is listening on PORT: ", process.env.PORT || 8080);
});
