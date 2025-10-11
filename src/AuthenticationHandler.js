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

        this.app.post('/vrf', this.auth.verifyToken, (req, res) => {
    
            const userID = req.user.id;
            const userPath = './clients/' + userID + "/";

            if(!name || !action || !fs.existsSync(userPath)) {

                res.json({ data: "" });
                return;
            }

            switch(action) {

                case "create": this.onNewDir(path.join(userPath, name)); break;
                case "delete": this.onDeleteDir(path.join(userPath, name)); break;
                case "rename": this.onRenameDir(path.join(userPath, name)); break;
            }

            res.json({ data: this.readDir(userPath) });
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
                res.json({ token: token });
                console.log("Login OK!");
            }
            catch(err) { console.log("Login Error: " + err); }
        });
    }

    

    async hashString(string) {

        return await bcrypt.hash(string, 10);
    }

    async verifyHash(string, hash) {

        return await bcrypt.compare(string, hash);
    }

    verifyToken(req, res, next) {
        
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Access denied' });

        jwst.verify(token, "jasonpasswordsecretkey", (err, user) => {
            if (err) return res.status(403).json({ message: 'Invalid token' });
            req.user = user;
            next();
        });
    }

    generateJWToken(user) {

        const token = jwst.sign({

            id: user.id,
            username: user.username
        }, "jasonpasswordsecretkey", { expiresIn: "1h" });

        return token;
    }
}

module.exports = AuthenticationHandler