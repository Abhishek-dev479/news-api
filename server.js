const express = require('express');
const app = express();
const bodyParser = require('body-parser');
// const fetch = require('node-fetch');
const router = require('./routes');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const ejs = require('ejs');


// Middleware
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookieParser());
app.use(router);

const port = process.env.PORT || 3000;


app.listen(port, (err) => {
    if(err) console.log(err);
    console.log('Server started on port 3000');
})











