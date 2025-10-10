const bcrypt = require('bcrypt');
const fs = require('fs');
const jwst = require('jsonwebtoken');
const path = require('path');

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
        this.app.post('/login', async (req, res) => {

            const { username, password } = req.body;
            if(!username || !password) {

                console.log("Request Invalid Received!");
                return;
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

    readDir(dirPath, indent = '|') {

        let result = '';
        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for(const item of items) {

            const fullPath = path.join(dirPath, item.name);
            if(item.isDirectory()) {

                result += `${indent}[DIR][${item.name}]\n`;
                result += this.readDir(fullPath, indent + ' ');
            }
            else result += `${indent}[FILE][${item.name}]\n`;
        }

        return result;
    }

    async enableFileAPI() {

        this.app.get('/fsapi', this.verifyToken, (req, res) => {

            const userID = req.user.id;

            if(!fs.existsSync('./clients/' + userID + "/"))
                fs.mkdirSync('./clients/' + userID + "/");

            const tree = this.readDir('./clients/' + userID + "/");
            res.json({ data: tree });
        }); 

        this.app.post('/fsapi/new_dir', this.verifyToken, (req, res) => {

            const userID = req.user.id;
            const name = req.body.name;
            const userPath = './clients/' + userID + "/";

            if(!name && !fs.existsSync(userPath)) {

                res.json({ data: "" });
                return;
            }

            const newPath = path.join(userPath, name);

            if(!fs.existsSync(newPath))
                fs.mkdirSync(newPath);
            res.json({ data: this.readDir(userPath) });
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