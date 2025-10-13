const AuthAPI = require('./AuthAPI');
const ProjectsAPI = require('./ProjectsAPI');

class APIManager {

    constructor(app, db) {

        this.db = db;
        this.app = app;
        this.authAPI = new AuthAPI(this.app, this.db);
        this.projectsAPI = new ProjectsAPI(this.app, this.db);
    }
}

module.exports = APIManager;