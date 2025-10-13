const bcrypt = require('bcrypt');
const fs = require('fs');
const jwst = require('jsonwebtoken');
const path = require('path');
const { act } = require('react');

class AuthenticationHandler {

    constructor(app, db) {

        this.db = db;
        this.app = app;      
    
        this.loginEnabled = false;
        this.registerEnabled = false;
    }

    async allowRegister(val) {

        this.registerEnabled = val;
        //IF YES

        this.app.get('/vrftk', this.verifyToken, (req, res) => {
            
            console.log("Token Verified For User " + req.user.id);
            res.status(200).json({ message: "ok"});
        }); 

        this.app.post('/login', async (req, res) => {

            console.log('login req received');
            const { username, password } = req.body;
            if(!username || !password) {

                return res.status(401).json({ message: 'Invalid credentials!'});
            }

            try {

                if(!this.db.isConnected()) {

                    console.log("Database Not Available, Returning Login.");
                    return;
                }

                const sql = "SELECT * FROM users WHERE username = ?";
                const dbResult = await this.db.run(sql, [username]);
                
                if(dbResult.rows.length != 1)
                    return res.status(401).json({ message: 'Invalid credentials!'});

                const user = dbResult.rows[0];
                if(!user) 
                    return res.status(401).json({ message: 'Invalid credentials!'});
                
                if(!this.verifyHash(password, dbResult.rows[0].password))
                    return res.status(401).json({ message: 'Invalid credentials!'});
                
                const token = this.generateJWToken(dbResult.rows[0]);
                res.status(200).json({ token: token });
                console.log("Login OK!");
            }
            catch(err) { console.log("Login Error: " + err); }
        });
    }
}

module.exports = AuthenticationHandler