var express = require('express');
var router = express.Router();
var Message = require("../models/message");
var Request = require("../models/request");
var User = require("../models/user");
var Project = require("../models/project");
var emailService = require("../services/emailService");
var winston = require('../config/winston');





  router.get('/:requestid/messages', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      return res.json(messages);
    });

  });


  router.get('/:requestid/messages.html', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      return res.render('messages', { title: 'Tiledesk', messages: messages});
    });

  });


  router.get('/:requestid/messages.csv', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).lean().exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      messages.forEach(function(element) {

        var channel_name = "";
        if (element.channel && element.channel.name) {
          channel_name = element.channel.name;
        }
        delete element.channel;
        element.channel_name = channel_name;

        delete element.attributes;
      });

      return res.csv(messages, true);
    });

  });

  router.get('/:requestid/messages-user.html', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      var messages = messages.filter(m => m.sender != "system" );


      //skip info message
      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }

      return res.render('messages', { title: 'Tiledesk', messages: messages});
    });

  });


  router.get('/:requestid/messages-user.csv', function(req, res) {
  
    winston.debug(req.params);
    winston.debug("here");    
    return Message.find({"recipient": req.params.requestid}).sort({createdAt: 'asc'}).lean().exec(function(err, messages) { 
      if (err) {
        return res.status(500).send({success: false, msg: 'Error getting object.'});
      }

      var messages = messages.filter(m => m.sender != "system" );


      //skip info message
      if(!messages){
        return res.status(404).send({success: false, msg: 'Object not found.'});
      }


      messages.forEach(function(element) {

        var channel_name = "";
        if (element.channel && element.channel.name) {
          channel_name = element.channel.name;
        }
        delete element.channel;
        element.channel_name = channel_name;

        delete element.attributes;
      });


      return res.csv(messages, true);
    });

  });

module.exports = router;
