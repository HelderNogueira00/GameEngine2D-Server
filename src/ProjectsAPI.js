const APIBase = require("./APIBase");
const ServerManager = require("./ServerManager");

class ProjectsAPI extends APIBase {

    constructor(app, db) {

        super(app, db, 'projects');
    }
    
    init() {
        
        this.onProjectsFetch = this.onProjectsFetch.bind(this);
        this.onProjectDelete = this.onProjectDelete.bind(this);
        this.onProjectCreate = this.onProjectCreate.bind(this);

        this.addRoute(true, 'get', 'fetch', this.onProjectsFetch);
        this.addRoute(true, 'post', 'delete', this.onProjectDelete);
        this.addRoute(true, 'post', 'create', this.onProjectCreate);
    }

    async onProjectsFetch(req, res) {

        const dbData = await this.db.run("SELECT * FROM projects WHERE userID = ?", [ req.user.id ]);

        if(dbData.rows.length > 0) {
            
            let projectData = "";
            for(const row of dbData.rows)
                projectData += row.id + "|" + row.userID + "|" + row.name + "|" + row.description + ";";

            return res.status(200).json({ data: projectData });
        }
        return res.status(200).json({ data: "null"});
    }

    async onProjectDelete(req, res) {

        const projectID = req.body.projectID;
        const userID = req.user.id;

        if(!projectID || !userID)
            return this.sendFail(res);

        await this.db.run("DELETE FROM projects WHERE userID = ? AND id = ?", [ userID, projectID ]);
        return res.status(200).json({ data: "ok" });
    }

    async onProjectCreate(req, res) {

        const userID = req.user.id;
        const name = req.body.projectName;
        const desc = req.body.projectDescription;

        if(!name || !desc || !userID)
            return this.sendFail(res);

        await this.db.run("INSERT INTO projects (id, userID, name, description) VALUES (DEFAULT, ?, ?, ?);", [userID, name, desc]);
        return res.status(200).json({ data: "ok" });
    }
}

module.exports = ProjectsAPI;