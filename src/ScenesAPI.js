const APIBase = require("./APIBase");
const path = require('path');
const fs = require('fs');

class ScenesAPI extends APIBase {

    constructor(app, db, fsAPI) {

        super(app, db, 'scenes');
        this.fsAPI = fsAPI;
    }

    init() {

        this.loadScene = this.loadScene.bind(this);
        this.createScene = this.createScene.bind(this);

        this.addRoute(true, 'post', 'load', this.loadScene);
        this.addRoute(true, 'post', 'create', this.createScene);
    }

    async createScene(req, res) {

        const userID = req.user.id;
        const { projectName, sceneName } = req.body;

        if(!userID || !projectName || !sceneName) 
            return this.sendFail(res);

        let userPath = path.join('./clients/', String(userID));
        userPath = path.join(userPath, projectName);

        if(!fs.existsSync(userPath))
            return this.sendFail(res);

        const scenePath = path.join(userPath, sceneName + ".ws");
        if(!fs.existsSync(scenePath))
            fs.writeFileSync(scenePath, "name: " + sceneName);

        return res.status(200).json({ data: this.fsAPI.buildDirTree(userPath, '|', projectName)});
    }

    async loadScene(req, res) {

        const userID = req.user.id;
        const { projectName, sceneName } = req.body;

        if(!userID || !projectName || !sceneName) 
            return this.sendFail(res);

        console.log("OK SCENE");
        let userPath = path.join('./clients/', String(userID));
        userPath = path.join(userPath, projectName);

        if(!fs.existsSync(userPath))
            return this.sendFail(res);

        const scenePath = path.join(userPath, sceneName);
        if(!fs.existsSync(scenePath))
            this.sendFail(res);

        return res.status(200).json({data: fs.readFileSync(scenePath, 'utf8')});
    }
}

module.exports = ScenesAPI;