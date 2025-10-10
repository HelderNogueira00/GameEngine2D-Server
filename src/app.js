require('dotenv').config();
const ServerManager = require('./ServerManager');
const server = new ServerManager();
server.initialize();