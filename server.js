const express = require("express");
const app = express();
const { engine } = require("express-handlebars");
const db = require("./db");
const cookieSession = require("cookie-session");

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
        sameSite: true,
    })
);

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(express.static("./public"));

app.get("/petition", (req, res) => {
    if (req.session.signed != true) {
        res.render("home", {});
    } else {
        res.redirect("/thanks");
    }
});

app.post("/petition", (req, res) => {
    // console.log("running POST /add-signature", req.body.signature);
    db.addSignature(req.body.firstName, req.body.lastName, req.body.signature)
        .then((result) => {
            console.log(result.rows);
            req.session.signed = true;
            req.session.signatureId = result.rows[0].id;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("err in addSignature: ", err);
            res.render("home", {
                error: true,
            });
        });
});

app.get("/thanks", (req, res) => {
    let dataUrl;
    db.getDataURL(req.session.signatureId)
        .then((result) => {
            dataUrl = result.rows[0].signature;
        })
        .catch((err) => {
            console.log("Error in db.getDataURL", err);
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
                // doesnt redirect sometimes
                /////////////////////////////
                /////////////////////////////
                /////////////////////////////
            }
        })
        .catch((err) => console.log("Error in db.countSignatures", err));
});

app.get("/signers", (req, res) => {
    // console.log("running GET /signs");
    db.getSignatures()
        .then((result) => {
            // console.log("result.rows from getSignatures", result.rows);
            res.render("signers", {
                results: result.rows,
            });
        })
        .catch((err) => console.log("Error in db.getSignatures", err));
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.send(`<h1>Logout successful</h1>
                <a href="/petition">Back to home</a>`);
});

app.listen(8080, () => {
    console.log("Server is listening on PORT 8080...");
});
