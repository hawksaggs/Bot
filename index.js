const restify = require('restify')
    , builder = require('botbuilder')
    , env = require('dotenv')
    , helperFunction = require('./helper/helper')
    ;

env.load();

var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3979, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    'appId': process.env.MICROSOFT_APP_ID,
    'appPassword': process.env.MICROSOFT_APP_PASSWORD
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);

bot.dialog('/', [
    function (session) {
            builder.Prompts.text(session, "Hi!, Can you Please fill up your KPI through KPI BOT \n Enter Yes or No.");    
    },
    function (session, results) {
        if (results.response.toLowerCase() == 'yes') {
            session.send('Rating should be given on the scale of 10, in which 10 is the Top most and 0 is the Least. Rating is given as per the defined rule:(0-2:Poor,3-4:Unsatisfactory,5-6:Average,7-8:Good,9-10:Excellent)');
            builder.Prompts.text(session, 'For:Productivity & Quality \n Automation of daily/routine tasks- Writing Effective Scripts');
        } else {
            session.send('May be another time.').endDialog();
        }
    },
    function (session, results) {
        session.send(results.response);
        if (results.response) {
            session.conversationData.param1 = results.response;
            builder.Prompts.text(session, 'For:Productivity & Quality \n Knowledge of Tools such as Anessus, Nikito');
        } else {
            builder.Prompts.text(session, 'For:Productivity & Quality \n Automation of daily/routine tasks- Writing Effective Scripts');
        }
    },
    function (session, results) {
        if (results.response) {
            if (session.conversationData.param1) {
                session.conversationData.param2 = results.response;
                builder.Prompts.text(session, 'For Process Compliance: \n Incidence Response');
            } else {
                session.conversationData.param1 = results.response;
                builder.Prompts.text(session, 'For:Productivity & Quality \n Automation of daily/routine tasks- Writing Effective Scripts');
            }
        } else {
            builder.Prompts.text(session, 'For:Productivity & Quality \n Automation of daily/routine tasks- Writing Effective Scripts');
        }
    },
    function (session, results) {
        if (results.response) {
            if (session.conversationData.param2) {
                session.conversationData.param3 = results.response;
                builder.Prompts.text(session, 'For Other Wow Factor: \n Proactive risk identification / migration');
            } else if (session.conversationData.param1) {
                session.conversationData.param2 = results.response;
                builder.Prompts.text(session, 'For Process Compliance: \n Incidence Response');
            } else {
                builder.Prompts.text(session, 'For:Productivity & Quality \n Knowledge of Tools such as Anessus, Nikito');
            }
        } else {
            builder.Prompts.text(session, 'For:Productivity & Quality \n Automation of daily/routine tasks- Writing Effective Scripts');
        }
    },
    function (session, results) {
        if (results.response) {
            if (session.conversationData.param3) {
                session.conversationData.param4 = results.response;
                console.log(session.conversationData);
                var headers = {
                    'content-type':'application/json'
                }
                helperFunction.hitAPI('POST', '/employee', session.conversationData, headers, function (err, response) {
                    if (err) {
                        console.log(err);  
                    } 
                    session.send('Thank you for the KPI Evaluation.').endConversation(); 
                });
            } else if (session.conversationData.param2) {
                session.conversationData.param3 = results.response;
                builder.Prompts.text(session, 'For Other Wow Factor: \n Proactive risk identification / migration');
            } else if (session.conversationData.param1) {
                session.conversationData.param2 = results.response;
                builder.Prompts.text(session, 'For Process Compliance: \n Incidence Response');
            }
        } else {
            builder.Prompts.text(session, 'For:Productivity & Quality \n Automation of daily/routine tasks- Writing Effective Scripts');
        }
    }
]);