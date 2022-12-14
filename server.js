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

///////////////////////   middleware   ///////////////////////////////

app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use((req, res, next) => {
    res.setHeader("x-frame-options", "deny");
    next();
});

app.use(
    cookieSession({
        secret: COOKIE_SECRET,
        maxAge: 1000 * 60 * 60 * 24 * 14,
        sameSite: true,
    })
);

if (process.env.NODE_ENV == "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"].startsWith("https")) {
            return next();
        }
        res.redirect(`https://${req.hostname}${req.url}`);
    });
}

////////////////////    HOME     /////////////////////////////////
app.get("/", (req, res) => {
    res.redirect("/register");
});

/////////////////    REGISTER    ////////////////////////////////
app.get("/register", (req, res) => {
    if (req.session.login === true) {
        res.redirect("/petition");
    } else {
        res.render("register", {
            title: "Registration Form",
        });
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
                    console.log("err in addUser: ", err);
                    res.render("register", {
                        title: "Registration Form",
                        error: true,
                    });
                });
        })
        .catch((err) => {
            console.log("error in bcrypt /register", err);
            res.sendStatus(500);
        });
});

///////////////////    LOGIN         /////////////////////////////
app.get("/login", (req, res) => {
    if (req.session.login !== true) {
        res.render("login", {
            title: "Login",
        });
    } else {
        res.redirect("/petition");
    }
});

app.post("/login", (req, res) => {
    db.login(req.body.email)
        .then((result) => {
            if (result.rows[0]) {
                bcrypt
                    .compare(req.body.password, result.rows[0].password)
                    .then((isCorrect) => {
                        if (isCorrect) {
                            req.session.login = true;
                            req.session.userId = result.rows[0].id;

                            db.findSignature(req.session.userId)
                                .then((result) => {
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
                                    console.log("err in findSignature ", err);
                                    res.sendStatus(500);
                                });
                        } else {
                            res.render("login", {
                                error: true,
                            });
                        }
                    });
            } else {
                res.render("login", {
                    title: "Login",
                    error: true,
                });
            }
        })
        .catch((err) => {
            console.log("err in login", err);
            res.render("login", {
                title: "Login",
                error: true,
            });
        });
});

/////////////////   PETITION     /////////////////////////////////
app.get("/petition", (req, res) => {
    if (req.session.login !== true) {
        res.redirect("/register");
    } else {
        if (req.session.signed != true) {
            res.render("petition", {
                title: "Petition",
            });
        } else {
            res.redirect("/thanks");
        }
    }
});

app.post("/petition", (req, res) => {
    // console.log("running POST /add-signature", req.body.signature);
    if (req.session.login == true) {
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
                    title: "Petition",
                    error: true,
                });
            });
    } else {
        res.sendStatus(403);
    }
});

///////////////////////    THANKS      ////////////////////////////////
app.get("/thanks", (req, res) => {
    if (req.session.signed) {
        let dataUrl;
        db.getDataURL(req.session.signatureId)
            .then((result) => {
                dataUrl = result.rows[0].signature;
                db.countSignatures()
                    .then((result) => {
                        req.session.numSignatures = result.rows[0].count;
                        if (req.session.signed) {
                            res.render("thanks", {
                                title: "Thank You Page",
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
                        console.log("Error in db.countSignatures", err);
                        res.sendStatus(500);
                    });
            })
            .catch((err) => {
                console.log("Error in db.getDataURL", err);
                res.sendStatus(500);
            });
    } else {
        res.redirect("/petition");
    }
});

///////////////////     SIGNERS       //////////////////////////////////
app.get("/signers", (req, res) => {
    // console.log("running GET /signs");
    if (req.session.signed) {
        db.getSigners()
            .then((result) => {
                // console.log("result.rows from getSigners", result.rows);
                res.render("signers", {
                    title: "All signers",
                    results: result.rows,
                });
            })
            .catch((err) => {
                console.log("Error in db.getSigners", err);
                res.sendStatus(500);
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers/:city", (req, res) => {
    let city = req.params.city;
    if (req.session.signed) {
        db.getSignersCity(city)
            .then((result) => {
                // console.log("result.rows from getSignersCity", result.rows);
                res.render("signers", {
                    title: "All signers from " + city,
                    results: result.rows,
                });
            })
            .catch((err) => {
                console.log("Error in db.getSignersCity", err);
                res.sendStatus(500);
            });
    } else {
        res.redirect("/petition");
    }
});

/////////////////////   PROFILE     /////////////////////////////////
app.get("/profile", (req, res) => {
    if (req.session.login === true) {
        res.render("profile", {
            title: "Profile",
        });
    } else {
        res.redirect("/register");
    }
});

app.post("/profile", (req, res) => {
    if (req.session.login == true) {
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
                        title: "Profile",
                        error: true,
                    });
                });
        }
    } else {
        res.sendStatus(403);
    }
});

///////////////////    DELETE SIGNATURE    /////////////////////////////
app.post("/deleteSignature", (req, res) => {
    if (req.session.login == true) {
        db.deleteSignature(req.session.userId)
            .then((result) => {
                req.session.signed = false;
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("err in deleteSignature", err);
                res.sendStatus(500);
            });
    } else {
        res.sendStatus(403);
    }
});

///////////////////    EDIT PROFILE    /////////////////////////////
app.get("/profile/edit", (req, res) => {
    if (req.session.login === true) {
        db.getProfile(req.session.userId)
            .then((result) => {
                res.render("editProfile", {
                    title: "Edit your profile",
                    results: result.rows,
                });
            })
            .catch((err) => {
                console.log("err in getProfile", err);
                res.sendStatus(500);
            });
    } else {
        res.redirect("/petition");
    }
});

app.post("/profile/edit", (req, res) => {
    if (req.session.login == true) {
        if (req.body.password === "") {
            db.editUser(
                req.body.first,
                req.body.last,
                req.body.email,
                req.session.userId
            )
                .then(() => {
                    db.editProfile(
                        req.body.age,
                        req.body.city,
                        req.body.url,
                        req.session.userId
                    )
                        .then(() => {
                            res.redirect("/thanks");
                        })
                        .catch((err) => {
                            console.log("err in editProfile ", err);
                            res.sendStatus(500);
                        });
                })
                .catch((err) => {
                    console.log("err in editUser ", err);
                });
        } else {
            bcrypt
                .hash(req.body.password)
                .then((hash) => {
                    db.editUserPassword(
                        req.body.first,
                        req.body.last,
                        req.body.email,
                        hash,
                        req.session.userId
                    )
                        .then(() => {
                            db.editProfile(
                                req.body.age,
                                req.body.city,
                                req.body.url,
                                req.session.userId
                            )
                                .then(() => {
                                    res.redirect("/thanks");
                                })
                                .catch((err) => {
                                    console.log("err in editProfile ", err);
                                });
                        })
                        .catch((err) => {
                            console.log("err in editUserPassword ", err);
                            res.sendStatus(500);
                        });
                })
                .catch((err) => {
                    console.log("err in bcrypt/editUserPassword ", err);
                    res.sendStatus(500);
                });
        }
    } else {
        res.sendStatus(403);
    }
});

//////////////////    DELETE ACCOUNT       ////////////////////////////
app.get("/delete", (req, res) => {
    if (req.session.login == true) {
        res.render("deleteAccount", {
            title: "Delete Account",
        });
    } else {
        res.redirect("/register");
    }
});

app.post("/delete", (req, res) => {
    if (req.session.login == true) {
        db.deleteSignature(req.session.userId)
            .then(() => {
                db.deleteProfile(req.session.userId)
                    .then(() => {
                        db.deleteUser(req.session.userId)
                            .then(() => {
                                req.session = null;
                                res.render("profileDeleted", {
                                    title: "Profile deleted",
                                });
                            })
                            .catch((err) => {
                                console.log("err in deleteUser ", err);
                                res.sendStatus(500);
                            });
                    })
                    .catch((err) => {
                        console.log("err in deleteSProfile ", err);
                        res.sendStatus(500);
                    });
            })
            .catch((err) => {
                console.log("err in deleteSignature ", err);
                res.sendStatus(500);
            });
    } else {
        res.redirect("/register");
    }
});

//////////////////    LOGOUT       ////////////////////////////
app.get("/logout", (req, res) => {
    req.session = null;
    res.render("logout", {
        title: "Logout",
    });
});

////////////////////    SERVER        ////////////////////////////////
app.listen(process.env.PORT || 8080, () => {
    console.log("Server is listening on PORT: ", process.env.PORT || 8080);
});
