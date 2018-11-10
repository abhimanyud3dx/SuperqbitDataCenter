var express = require('express');
var router = express.Router();
var Promise = require("bluebird");
var nforce = require('nforce');
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var org = require('../lib/connection');
var cron = require('node-cron');


// Connection string to Connect to MongoDB.
const uriDec = "mongodb+srv://abhimanyuDB:godofwar101A@cluster0-zrfv4.mongodb.net/";
var uri = encodeURI(uriDec);

/*  Shopify Products. */
router.get('/getShopifyProducts', function(req, res, next) {	
	  // query for record, contacts and opportunities
	Promise.join(
    org.query({ query: "Select Id, API_Name__c,product_Id__c From Shopify_Product__c where Available__c = true"}),
    function(products) {
		res.send(products);
    });
});


/* home page. */
router.get('/admin', function(req, res, next) {	
	var resultArray = [];
	MongoClient.connect(uri, function(err, db) {
		if(err) {
			console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
		}
		else{		   
			console.log('Connected....');			
			var dbo = db.db("sforce");  
			var cursor = dbo.collection("Contact").find();
			//response.send(db+'');
			cursor.forEach(function(record, err) {
				assert.equal(null, err);
				resultArray.push(record);
			}, function() {
				db.close();
				org.query({ query: "Select Id, Name, Type, Industry, Rating From Account Order By LastModifiedDate DESC" })
				.then(function(results){
					res.render('index', { records: results.records , mongoRecords: resultArray });
				});
			});
		}
	});
});

/* home page. */
router.get('/', function(req, res, next) {	
	var resultArray = [];
	MongoClient.connect(uri, function(err, db) {
		if(err) {
			console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
		}
		else{		   
			console.log('Connected....');			
			var dbo = db.db("sforce");  
			var cursor = dbo.collection("Contact").find();
			//response.send(db+'');
			cursor.forEach(function(record, err) {
				assert.equal(null, err);
				resultArray.push(record);
			}, function() {
				db.close();
				org.query({ query: "Select Id, Name, Type, Industry, Rating From Account Order By LastModifiedDate DESC" })
				.then(function(results){
					res.render('index', { records: results.records , mongoRecords: resultArray });
				});
			});
		}
	});
	
	//cron.schedule('0,5,10,15,20,25,30,35,40,45,50,55 * * * * *', function(){
		org.query({ query: "Select Id, Name, Type, Industry, Rating From Account Order By LastModifiedDate DESC LIMIT 1" })
		.then(function(results){
			console.log(results.records);
		});
		console.log('running a task every Second');
	//});
});

/* get MongoDatabses. */
router.get('/getDatabases', function(request, response, next) {
	var resultArray = [];
	MongoClient.connect(uri, function(err, db) {
		assert.equal(null, err);
		console.log('Connected....');
		var adminDb = db.admin();
		adminDb.listDatabases(function(err, result) {
			response.send(result.databases);
		});
	});
});

/* get MongoDB Data. */
router.get('/getData', function(request, response, next) {
  	var resultArray = [];
	MongoClient.connect(uri, function(err, db) {
		if(err) {
			console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
		}
		else{		   
			console.log('Connected....');			
			var dbo = db.db("sforce");  
			var cursor = dbo.collection("Contact").find();
			//response.send(db+'');
			cursor.forEach(function(doc, err) {
				assert.equal(null, err);
				resultArray.push(doc);
			}, function() {
				db.close();
				//res.render('index', {items: resultArray});
				response.send(resultArray);
			});
		}
	});
});

/* Display new account form */
router.get('/new', function(req, res, next) {
  res.render('new');
});

/* Creates a new the record */
router.post('/', function(req, res, next) {

  var acc = nforce.createSObject('Account');
  acc.set('Name', req.body.name);
  acc.set('Industry', req.body.industry);
  acc.set('Type', req.body.type);
  acc.set('AccountNumber', req.body.accountNumber);
  acc.set('Description', req.body.description);

  org.insert({ sobject: acc })
    .then(function(account){
      res.redirect('/' + account.id);
    })
});

/* Record detail page */
router.get('/:id', function(req, res, next) {
  // query for record, contacts and opportunities
  Promise.join(
    org.getRecord({ type: 'account', id: req.params.id }),
    org.query({ query: "Select Id, Name, Email, Title, Phone From Contact where AccountId = '" + req.params.id + "'"}),
    org.query({ query: "Select Id, Name, StageName, Amount, Probability From Opportunity where AccountId = '" + req.params.id + "'"}),
    function(account, contacts, opportunities) {
        res.render('show', { record: account, contacts: contacts.records, opps: opportunities.records });
    });
});

/* Display record update form */
router.get('/:id/edit', function(req, res, next) {
  org.getRecord({ id: req.params.id, type: 'Account'})
    .then(function(account){
      res.render('edit', { record: account });
    });
});

/* Display record update form */
router.get('/:id/delete', function(req, res, next) {

  var acc = nforce.createSObject('Account');
  acc.set('Id', req.params.id);

  org.delete({ sobject: acc })
    .then(function(account){
      res.redirect('/');
    });
});

/* Updates the record */
router.post('/:id', function(req, res, next) {
  var acc = nforce.createSObject('Account');
  acc.set('Id', req.params.id);
  acc.set('Name', req.body.name);
  acc.set('Industry', req.body.industry);
  acc.set('Type', req.body.type);
  acc.set('AccountNumber', req.body.accountNumber);
  acc.set('Description', req.body.description);

  org.update({ sobject: acc })
    .then(function(){
      res.redirect('/' + req.params.id);
    })
});

module.exports = router;
