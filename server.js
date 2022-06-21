// to do:
// vuln

const express = require("express");
const app = express();
const { engine } = require("express-handlebars");
const db = require("./db");
const cookieSession = require("cookie-session");
let numSignatures;

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use("/", express.static("./public"));

app.get("/", (req, res) => {
    if (req.session.signed != true) {
        res.render("home", {});
    } else {
        res.redirect("/thanks");
    }
});

app.post("/", (req, res) => {
    // console.log("running POST /add-signature", req.body.signature);
    db.addSignature(req.body.firstName, req.body.lastName, req.body.signature)
        .then(() => {
            db.countSignatures()
                .then((result) => {
                    numSignatures = result.rows[0].count;
                })
                .catch((err) =>
                    console.log("Error in db.countSignatures", err)
                );
            req.session.signed = true;
            req.session.signatureURL = req.body.signature;
            // console.log(req.body);
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
    if (req.session.signed == true) {
        res.render("thanks", {
            data: {
                url: req.session.signatureURL,
                numSignatures: numSignatures,
                /////////////////////////////
                /////////////////////////////
                /////////////////////////////
            },
        });
    } else {
        console.log("eq.session.signed !== true");
        res.redirect("/");
        /////////////////////////////
        /////////////////////////////
        /////////////////////////////
    }
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
    res.send("<h1>Logout successful</h1>");
});

app.listen(8080, () => {
    console.log("Server is listening on PORT 8080...");
});
