const cors = require('cors');
const AuthManager = require('./AuthManager');

class APIBase {

    constructor(app, db, baseAddress) {

        this.db = db;
        this.app = app;
        this.baseAddress = baseAddress;
        this.authManager = new AuthManager();

        this.init();
    }

    addRoute(protect, method, address, exec) {

        if(method === 'get' && protect)
            this.app.get('/' + this.baseAddress + '/' + address, this.authManager.verifyToken, async (req, res) => exec(req, res));
        
        else if (method === 'post' && protect)
            this.app.post('/' + this.baseAddress + '/' + address, this.authManager.verifyToken, async (req, res) => exec(req, res));    

        else if (method === 'post' && !protect)
            this.app.post('/' + this.baseAddress + '/' + address, async (req, res) => exec(req, res));    

        else if (method === 'get' && !protect)
            this.app.get('/' + this.baseAddress + '/' + address, async (req, res) => exec(req, res));    
    }

    init() { }
    sendFail(res) {

        res.status(401).json({ data: "something went wrong!" });
    }
}

module.exports = APIBase;