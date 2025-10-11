const cors = require('cors');
const express = require('express');
const DBManager = require('./DatabaseManager');
const AuthManager = require('./AuthenticationHandler');

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
    }

    async initialize() {

        this.app.use(cors());
        this.app.use(express.json());

        await this.db.connect();
        await this.auth.allowRegister(true);
        await this.auth.enableFileAPI();
      
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