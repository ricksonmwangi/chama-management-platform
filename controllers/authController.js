const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {

    try {

        const {
            username,
            password,
            role
        } = req.body;

        const passwordHash =
            await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users
            (username, password_hash, role)
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [username, passwordHash, role],
            (err, result) => {

                if(err){
                    return res.status(500).json(err);
                }

                res.json({
                    message: "User registered successfully"
                });
            }
        );

    } catch(error){

        res.status(500).json(error);

    }
};exports.register = async (req, res) => {

    try {

        const {
            username,
            password,
            role
        } = req.body;

        const passwordHash =
            await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users
            (username, password_hash, role)
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [username, passwordHash, role],
            (err, result) => {

                if(err){
                    return res.status(500).json(err);
                }

                res.json({
                    message: "User registered successfully"
                });
            }
        );

    } catch(error){

        res.status(500).json(error);

    }
};

exports.login = (req, res) => {

    const { username, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, results) => {

            if(err){
                return res.status(500).json(err);
            }

            if(results.length === 0){
                return res.status(401).json({
                    message: "Invalid credentials"
                });
            }

            const user = results[0];

            const validPassword =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );

            if(!validPassword){
                return res.status(401).json({
                    message: "Invalid credentials"
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );

            res.json({
                token
            });
        }
    );
};