
'use strict';


var schedule = require('node-schedule');
var winston = require('../../../config/winston');
var Request = require("../../../models/request");
var requestService = require("../../../services/requestService");


class CloseBotUnresponsiveRequestTask {

constructor() {
  this.enabled = process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_ENABLE || "true"; 
  this.cronExp = process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_CRON_EXPRESSION || '*/5 * * * *'; // every 5 minutes  // every 30 seconds '*/30 * * * * *';
  this.queryAfterTimeout = parseInt(process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_AFTER_TIMEOUT) || 2 * 24 * 60 * 60 * 1000; //two days ago //172800000 two days // 86400000 a day
  this.queryLimit = parseInt(process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_QUERY_LIMIT) || 10;
  this.queryProject = process.env.CLOSE_BOT_UNRESPONSIVE_REQUESTS_QUERY_FILTER_ONLY_PROJECT; //example in PRE: {"$in":["5fc224ce05416200342af18a","5fb3e3cb0150a00034ab77d5"]}

  if (this.queryProject) {
    winston.info("CloseBotUnresponsiveRequestTask filter only by projects enabled: " + this.queryProject );
  }
//  qui ha senso la query?????? nn viene piu ricaricata?

    // var stringQuery = process.env.CLOSE_UNRESPONSIVE_REQUESTS_QUERY;
  // if (stringQuery) {
  //   this.query = JSON.parse(stringQuery) || {hasBot:true, status: { $lt: 1000 }, createdAt:  { $lte :new Date(Date.now() - this.queryAfterTimeout ).toISOString()} };
  // }else {
  //   this.query = {hasBot:true, status: { $lt: 1000 }, createdAt:  { $lte :new Date(Date.now() - this.queryAfterTimeout ).toISOString()} }; 
  // }
  
}

run() {
    if (this.enabled == "true") {
      winston.info("CloseBotUnresponsiveRequestTask started" );
      this.scheduleUnresponsiveRequests();
    } else {
      winston.info("CloseBotUnresponsiveRequestTask disabled" );
    }
}

scheduleUnresponsiveRequests() {
  var that = this;
  winston.info("CloseBotUnresponsiveRequestTask task scheduleUnresponsiveRequests launched with closeAfter : " + this.queryAfterTimeout + " milliseconds, cron expression: " + this.cronExp + " and query limit: " +this.queryLimit);
  // if (this.queryProject) {
  //   winston.info("CloseBotUnresponsiveRequestTask query altered: " + JSON.stringify(this.query));
  // }

 //https://crontab.guru/examples.html
 var s= schedule.scheduleJob(this.cronExp, function(fireDate){   //TODO aggiungi un bias random

    let timeInMs = Math.random() * (1000);  // avoid cluster concurrent jobs in multiple nodes delay between 0 and 1sec
    winston.debug('timeInMs => '+ timeInMs);

    setTimeout(function () {
      winston.debug('CloseBotUnresponsiveRequestTask scheduleUnresponsiveRequests job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
      that.findUnresponsiveRequests(); 
    },timeInMs );
  });
}


findUnresponsiveRequests() {
    
  // db.getCollection('requests').find({"hasBot":true, "status": { "$lt": 1000 }, "createdAt":  { "$lte" :new ISODate("2020-11-28T20:15:31Z")} }).count()
    
    var query = {hasBot:true, status: { $lt: 1000 }, createdAt:  { $lte :new Date(Date.now() - this.queryAfterTimeout ).toISOString()} };

    if (this.queryProject) {
      query.id_project = JSON.parse(this.queryProject);
    }



    winston.debug("CloseBotUnresponsiveRequestTask query",query);

    Request.find(query)
    .sort({createdAt: 'asc'}) //DA TESTARE
    .limit(this.queryLimit).exec(function(err, requests) {
      //it is limited to 1000 results but after same days it all ok
      if (err) {
          winston.error("CloseBotUnresponsiveRequestTask error getting unresponsive requests ", err);
          return 0;
      }
      if (!requests || (requests && requests.length==0)) {
          winston.verbose("CloseBotUnresponsiveRequestTask no unresponsive requests found ");
          return 0;
      }

      winston.info("CloseBotUnresponsiveRequestTask: found " + requests.length +  " unresponsive requests");
      winston.debug("CloseBotUnresponsiveRequestTask: found unresponsive requests ", requests);
      
      requests.forEach(request => {

        winston.debug("********unresponsive request ", request);

         //  closeRequestByRequestId(request_id, id_project, skipStatsUpdate, notify, closed_by)
        const closed_by = "_bot_unresponsive";
        return requestService.closeRequestByRequestId(request.request_id, request.id_project, false, false, closed_by).then(function(updatedStatusRequest) {
          winston.info("CloseBotUnresponsiveRequestTask: Request closed with request_id: " + request.request_id);
          // winston.info("Request closed",updatedStatusRequest);
        }).catch(function(err) {
          winston.error("CloseBotUnresponsiveRequestTask: Error closing the request with request_id: " + request.request_id, err);
        })

      });

    

    });
  }


  

   
}
 
 
 
 
var closeBotUnresponsiveRequestTask = new CloseBotUnresponsiveRequestTask();


module.exports = closeBotUnresponsiveRequestTask;