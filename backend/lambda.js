const serverlessExpress = require("@vendia/serverless-express");
const expressApp = require("./server"); // cần sửa lại server.js để export app

exports.handler = serverlessExpress({ app: expressApp });
