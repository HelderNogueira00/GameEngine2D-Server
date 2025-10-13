const APIBase = require("./APIBase");

class AuthAPI extends APIBase {

    constructor(app, db) {

        super(app, db, 'auth');
    }

    init() {

        this.onLogin = this.onLogin.bind(this);
        this.onVerifyToken = this.onVerifyToken.bind(this);

        this.addRoute(false, 'post', 'login', this.onLogin);
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
                    
                    const dbUsername = dbResult.rows[0].username;
                    const dbPassword = dbResult.rows[0].password;
                    
                    if(dbUsername && dbPassword) {
                        
                        const valid = await this.authManager.verifyHash(password, dbPassword);
                        if(valid) {

                            console.log("Auth API [OnLogin] => OK: " + req.body);
                            return res.status(200).json({ token: this.authManager.generateJWToken(dbUser) });
                        }
                    }
                }
            }
        }
        catch(err) { console.log("DB ERROR: " + err); }

        console.log("Auth API [OnLogin] => Error: " + req.body);
        return this.sendFail(res);
    }

    async onVerifyToken(req, res) {

        await this.authManager.verifyToken(req, res, () => {

            console.log("Auth API [OnLoginToken] => OK: " + req.user);
            return res.status(200).json({ valid: 0 });
        });
    }
}

module.exports = AuthAPI;