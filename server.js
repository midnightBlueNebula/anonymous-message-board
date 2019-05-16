'use strict';

var express     = require('express');
var bodyParser  = require('body-parser');
var expect      = require('chai').expect;
var cors        = require('cors');

var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');
var MongoClient       = require('mongodb').MongoClient;
var helmet            = require('helmet')

var app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(helmet.xssFilter());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.frameguard({action:'sameorigin'}));
/*app.use(helmet.contentSecurityPolicy({directives:{defaultSrc:["'self'"],
                                                  scriptSrc:["'self'"],
                                                  styleSrc:["'self'","hyperdev.com"],
                                                  imgSrc:["'self'","cdn.gomix.com"]}}));*/

const CONNECTION_STRING = process.env.DB; 


//For FCC testing purposes
fccTestingRoutes(app);


MongoClient.connect(CONNECTION_STRING, { useNewUrlParser: true },function(err, client) {
  if(err){
    console.log('Connection attempt to mongodb failed');
  }
  else{
    console.log('Connected to mongodb successfully.');
  }
  var db = client.db('cluster0');
  
  //Routing for API 
  apiRoutes(app,db);
  
  //Sample Front-end
  
      
  //404 Not Found Middleware
  app.use(function(req, res, next) {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
  
  //Start our server and tests!
  app.listen(process.env.PORT || 3000, function () {
    console.log("Listening on port " + process.env.PORT);
    if(process.env.NODE_ENV==='test') {
      console.log('Running Tests...');
      setTimeout(function () {
        try {
          runner.run();
        } catch(e) {
          var error = e;
            console.log('Tests are not valid:');
            console.log(error);
        }
      }, 1500);
    }
  });
})

module.exports = app; //for testing
