const APIBase = require("./APIBase");

class AuthAPI extends APIBase {

    constructor(app, db) {

        super(app, db, 'auth');
    }

    init() {

        this.onLogin = this.onLogin.bind(this);
        this.onLogout = this.onLogout.bind(this);
        this.onVerifyToken = this.onVerifyToken.bind(this);

        this.addRoute(false, 'post', 'login', this.onLogin);
        this.addRoute(true, 'get', 'logout', this.onLogout);
        this.addRoute(false, 'get', 'token',  this.onVerifyToken);
    }

    async onLogin(req, res) {

        const { username, password } = req.body;
        if(!username || !password) 
            return this.sendFail(res);

        if(this.db === undefined)
            return this.sendFail(res);
        
        if(!this.db.isConnected())
            return this.sendFail(res);

        try {
            
            const dbResult = await this.db.run("SELECT * FROM users WHERE username = ?", [username]);
            
            if(dbResult.rows.length === 1) {
                
                const dbUser = dbResult.rows[0];
                if(dbUser) {
                    
                    const dbID = dbResult.rows[0].id;
                    const dbUsername = dbResult.rows[0].username;
                    const dbPassword = dbResult.rows[0].password;
                    
                    if(dbUsername && dbPassword) {
                        
                        const valid = await this.authManager.verifyHash(password, dbPassword);
                        if(valid) {

                            console.log("Auth API [OnLogin] => OK: " + req.body);
                            this.db.run("INSERT INTO logins (id, userID, timestamp, action) VALUES (DEFAULT, ?, DEFAULT, 'Login')", [dbID]);
                            return res.status(200).json({ token: this.authManager.generateJWToken(dbUser) });
                        }
                    }
                }
            }
        }
        catch(err) { console.log("DB ERROR: " + err); }

        console.log("Auth API [OnLogin] => Error: " + req.body);
        this.db.run("INSERT INTO logins (id, userID, timestamp, action) VALUES (DEFAULT, ?, DEFAULT, 'Attempt')", [1]);
        return this.sendFail(res);
    }

    async onVerifyToken(req, res) {

        await this.authManager.verifyToken(req, res, () => {

            console.log("Auth API [OnLoginToken] => OK: " + req.user);
            return res.status(200).json({ valid: 0 });
        });
    }

    async onLogout(req, res) {

        const userID = req.user.id;
        this.db.run("INSERT INTO logins (id, userID, timestamp, action) VALUES (DEFAULT, ?, DEFAULT, 'Logout')", [userID]);

        return res.status(200).json({ data: "ok" });
    }
}

module.exports = AuthAPI;