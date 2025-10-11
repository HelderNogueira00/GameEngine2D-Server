const fs = require('fs');

class FSManager {

    constructor(app, auth) {

        this.app = app;
        this.auth = auth;
    }

    onNewDir(path) {

        if(!fs.existsSync(path))
            fs.mkdirSync(path);
    }

    onDeleteDir(path) {

        if(fs.existsSync(path))
            fs.rmSync(path, { recursive: true, force: true });
    }

    onRenameDir(path) {

        if(fs.existsSync(path))
            fs.renameSync(path);
    }

    getExtension(path) {

        let ext = path.split('.').pop();
        if(ext.includes("\\"))
            ext = "DIR";

        switch(ext) {

            case "txt": ext = "TEXT"; break;
            case "js": ext = "SCRIPT"; break;
            case "png": ext = "IMAGE"; break;
        }

        return ext;
    }

    readDir(dirPath, indent = '|') {

        let index = 1;
        let result = '';
        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for(const item of items) {

            const fullPath = path.join(dirPath, item.name);
            const userID = fullPath.split('\\')[1];
            const match = "clients\\" + userID + "\\";
            console.log(match) ;
            const index = fullPath.indexOf(match);
            const basePath = fullPath.substring(index + match.length);
            const extension = this.getExtension(fullPath);

            if(item.isDirectory()) {

                result += `${indent}[${extension}][${basePath}]\n`;
                result += this.readDir(fullPath, indent);
            }
            else result += `${indent}[${extension}][${basePath}]\n`;
        }

        return result;
    }

    async enableRoutes() {

        this.app.get('/fsapi', this.auth.verifyToken, (req, res) => {
        
            const userID = req.user.id;
            const userPath = './clients/' + userID + "/";

            if(!fs.existsSync('./clients/' + userID + "/"))
                fs.mkdirSync('./clients/' + userID + "/");

            res.json({ data: this.readDir(userPath) });
        }); 
        
        this.app.post('/fsapi/dir', this.auth.verifyToken, (req, res) => {

            const userID = req.user.id;
            const action = req.body.action;
            const name = req.body.name;
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
    }
}

module.exports = FSManager;