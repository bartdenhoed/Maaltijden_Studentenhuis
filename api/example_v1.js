var express = require('express');
var routes = express.Router();

module.exports = {}

var mijnObject = {
	mijntekst: 'Hello World!'
};

routes.get('/hello', function (req, res) {
	res.status(200);
	res.json(mijnObject);
});

routes.post('/hello', function (req, res) {
	var body = req.body;

	console.log(body);
	console.dir(body);

	res.status(200);
	res.json(mijnObject);
});

routes.get('/hello/error', function (req, res, next) {
	next('HIER TREEDT EEN ERROR OP');
});


routes.get('/hello/*', function (req, res, next) {
	res.status(404);
	res.json({
		message: 'Deze endpoint bestaat nog niet'
	});
	res.end();
});

// routes.get('/todos', todoController.getAll);
// routes.get('/todos/:id', todoController.getOneById);
// routes.get('/todos/errordemo', todoController.errorDemo);
// routes.all('/todos*', todoController.catchAll);

module.exports = routes;