const path = require('path');
const APIBase = require('./APIBase');
const fs = require('fs');


class FilesystemAPI extends APIBase {

    constructor(app, db) {

        super(app, db, 'fs');
    }

    init() {

        this.onDelete = this.onDelete.bind(this);
        this.onRefresh = this.onRefresh.bind(this);
        this.onCreateDir = this.onCreateDir.bind(this);
        this.onRenameDir = this.onRenameDir.bind(this);

        this.addRoute(true, 'post', 'delete', this.onDelete);
        this.addRoute(true, 'post', 'refresh', this.onRefresh);
        this.addRoute(true, 'post', 'rename', this.onRenameDir);
        this.addRoute(true, 'post', 'create_dir', this.onCreateDir);
    }

    async onDelete(req, res) {

        const userID = req.user.id;
        const { projectID, name } = req.body;

        if(!userID || !name || !projectID)
            return this.sendFail(res);

        if(!this.db.isConnected())
            return this.sendFail(res);
        
        try {

            const sql = "SELECT * FROM projects WHERE id = ? AND userID = ?;";
            const dbData = await this.db.run(sql, [projectID, userID]);

            if(dbData.rows.length === 1) {

                const projectName = dbData.rows[0].name;
                const userPath = './clients/' + userID + "/";
                const projectPath = path.join(userPath,projectName);
                const targetPath = path.join(projectPath, name);
               
                if(fs.existsSync(targetPath))
                    fs.rmSync(targetPath, { recursive: true, force: true });

                return res.status(200).json({ data: this.buildDirTree(projectPath, '|', projectName) });
            }
        }
        catch(err) { console.log("FS Delete Dir Error: " + err); }
        return this.sendFail(res);
    }

    async onRenameDir(req, res) {

        const userID = req.user.id;
        const { projectID, name, newName } = req.body;

        if(!userID || !name || !projectID)
            return this.sendFail(res);

        if(!this.db.isConnected())
            return this.sendFail(res);
        
        try {

            const sql = "SELECT * FROM projects WHERE id = ? AND userID = ?;";
            const dbData = await this.db.run(sql, [projectID, userID]);

            if(dbData.rows.length === 1) {

                const projectName = dbData.rows[0].name;
                const userPath = './clients/' + userID + "/";
                const projectPath = path.join(userPath,projectName);
                const currentPath = path.join(projectPath, name);
                const newPath = path.join(projectPath, newName);

                if(fs.existsSync(currentPath))
                    fs.renameSync(currentPath, newPath);

                return res.status(200).json({ data: this.buildDirTree(projectPath, '|', projectName) });
            }
        }
        catch(err) { console.log("FS Create Dir Error: " + err); }
        return this.sendFail(res);
    }

    async onCreateDir(req, res) {

        const userID = req.user.id;
        const { projectID, name } = req.body;

        if(!userID || !name || !projectID)
            return this.sendFail(res);

        if(!this.db.isConnected())
            return this.sendFail(res);
        
        try {

            const sql = "SELECT * FROM projects WHERE id = ? AND userID = ?;";
            const dbData = await this.db.run(sql, [projectID, userID]);

            if(dbData.rows.length === 1) {

                const projectName = dbData.rows[0].name;
                const userPath = './clients/' + userID + "/";
                const projectPath = path.join(userPath,projectName);
                const targetPath = path.join(projectPath, name);

                if(!fs.existsSync(targetPath))
                    fs.mkdirSync(targetPath);

                return res.status(200).json({ data: this.buildDirTree(projectPath, '|', projectName) });
            }
        }
        catch(err) { console.log("FS Create Dir Error: " + err); }
        return this.sendFail(res);
    }

    async onRefresh(req, res) {

        const userID = req.user.id;
        const { projectID } = req.body;
        
        if(!userID || !projectID)
            return this.sendFail(res);
        
        if(!this.db.isConnected())
            return this.sendFail(res);
        
        try {

            const sql = "SELECT * FROM projects WHERE id = ? AND userID = ?";
            const dbData = await this.db.run(sql, [projectID, userID]);
            
            if(dbData.rows.length === 1) {

                const projectName = dbData.rows[0].name;
                const userPath = './clients/' + userID + "/";
                const projectPath = path.join(userPath, projectName);

                if(!fs.existsSync(projectPath))
                    fs.mkdirSync(projectPath);

                console.log("User #" + userID + " Rereshing FS: " + projectPath);
                return res.status(200).json({ data: this.buildDirTree(projectPath, '|', projectName)});
            }
        }
        catch(err) { console.log("FS Refresh Error: " + err); }
        return this.sendFail(res);
    }

    buildDirTree(dirPath, indent = '|', projectName) {

        let index = 1;
        let result = '';
        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for(const item of items) {

            const fullPath = path.join(dirPath, item.name);
            const userID = fullPath.split('\\')[1];
            const match = "clients\\" + userID + "\\" + projectName + "\\";
            console.log(match) ;
            const index = fullPath.indexOf(match);
            const basePath = fullPath.substring(index + match.length);
            const extension = this.getExtension(fullPath);

            if(item.isDirectory()) {

                result += `${indent}[${extension}][${basePath}]\n`;
                result += this.buildDirTree(fullPath, indent, projectName);
            }
            else result += `${indent}[${extension}][${basePath}]\n`;
        }

        return result;
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
}

module.exports = FilesystemAPI;