const express = require('express');
var app = express();
var cors = require('cors');
app.use(cors());
const bodyParser = require('body-parser');
const port = process.env.PORT || 3009;

var routing = require("./routing");

app.set('view engine', 'pug');

app.use(bodyParser.json());

app.use('/', routing);
app.listen(port);