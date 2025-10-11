const cors = require('cors');
const express = require('express');
const DBManager = require('./DatabaseManager');
const AuthManager = require('./AuthenticationHandler');
const FSManager = require('./FSManager');

class ServerManager {

    constructor() {
    
        this.app = express();
        this.db = new DBManager({
            
            host: '127.0.0.1',
            user: 'engine',
            password: 'engine',
            database: 'squared2d'
        });    

        this.auth = new AuthManager(this.app, this.db);
        this.fs = new FSManager(this.app, this.auth);
    }

    async initialize() {

        this.app.use(cors());
        this.app.use(express.json());

        await this.db.connect();
        await this.fs.enableRoutes();
        await this.auth.allowRegister(true);
      
        this.app.get('/prv', this.auth.verifyToken, (req, res) => {

            res.json({message: 'Hello World From Logged In Users Only'});
        });

        this.app.listen(3000, () => {

            console.log("Server Listening: ");
        });
    }

    async authenticate(req) {


    }
}

module.exports = ServerManager;