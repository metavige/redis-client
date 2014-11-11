var express = require('express'),
    wines = require('./routes/redis');

var app = express();

app.post('/redis', wines.create);
// app.get('/wines/:id', wines.findById);

app.listen(3000);
console.log('Listening on port 3000...');
