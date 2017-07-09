const restify = require('restify')
    , builder = require('botbuilder')
    , env = require('dotenv')
    , helperFunction = require('./helper/helper')
    , request = require('request')
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
        session.say('Hello');
        builder.Prompts.choice(session,
            'Are you Employee or TL? ',
            ['Employee', 'TL'],
            { listStyle: builder.ListStyle.button });
    },
    function (session,results) {
        if (results.response.entity.toLowerCase() == 'employee' || results.response.entity.toLowerCase() == 'employed') {
            session.beginDialog('employee');
        } else if (results.response.entity == 'TL') {
            session.beginDialog('tl');
        } else {
            session.replaceDialog('/', { isReprompt: true });
        }
    }
])

bot.dialog('employee', [
    function (session) { 
        session.conversationData.productivityAndQuality = {};
        builder.Prompts.choice(session,
            'Can you Please fill up your KPI through KPI BOT.',
            ['Yes', 'No'],
            { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        if (results.response.entity.toLowerCase() == 'yes') {
            var card = {
                'contentType': 'application/vnd.microsoft.card.adaptive',
                'content': {
                    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
                    'type': 'AdaptiveCard',
                    'version': '1.0',
                    'speak':'Rating should be given on the scale of 10, in which 10 is the Top most and 0 is the Least.',
                    'body': [
                        {
                            'type': 'Container',
                            'speak': 'Rating should be given on the scale of 10, in which 10 is the Top most and 0 is the Least.Rating is given as per the defined rule:(0-2:Poor,3-4:Unsatisfactory,5-6:Average,text,7-8:Good,9-10:Excellent)',
                            'items': [
                                {
                                    'type': 'ColumnSet',
                                    'columns': [
                                        {
                                            'type': 'Column',
                                            'size': 'stretch',
                                            'items': [
                                                {
                                                    'type': 'TextBlock',
                                                    'text': 'Rating should be given on the scale of 10, in which 10 is the Top most and 0 is the Least.',
                                                    'weight': 'bolder',
                                                    'isSubtle': true,
                                                    'wrap':true
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': 'Rating is given as per the defined rule:',
                                                    'weight': 'bolder',
                                                    'isSubtle': true
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': '0-2:Poor',
                                                    'wrap': true
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': '3-4:Unsatisfactory',
                                                    'wrap': true
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': '5-6:Average',
                                                    'wrap': true
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': '7-8:Good',
                                                    'wrap': true
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': '9-10:Excellent',
                                                    'wrap': true
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            };
            var msg = new builder.Message(session)
                .addAttachment(card);
            session.send(msg);
            var promptCard = makeAdaptiveCard('What\'s your name: ', 'What\'s your name: ');
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.text(session, msg);
        } else if (results.response.entity.toLowerCase() == 'no') {
            session.send('May be another time.').endDialog();
        } else {
            session.send('I am learning day by day, but this time i don\'t understand what you are saying.');
            session.send('So, Please Enter Yes or No');
        }
    },
    function (session, results) {
        if (results.response) {
            session.conversationData.name = results.response;
            var promptCard = makeAdaptiveCard('What\'s your Employee Id: ', 'What\'s your Employee Id: ');
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
        } else {
            builder.Prompts.text(session, 'What\'s your name: ');
      }  
    },
    function (session, results) {
        if (results.response) {
            session.conversationData.employeeId = results.response;
            var promptCard = makeAdaptiveCard('Productivity & Quality', 'Productivity & Quality');
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            session.send(msg);
            var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
        } else {
            var promptCard = makeAdaptiveCard('What\'s your Employee Id: ', 'What\'s your Employee Id: ');
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
        }
    },
    function (session, results) {
        if (results.response) {
            if (checkNumber(results) != '') {
                session.send(checkNumber(results));
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
            } else {
                setConversationData(session, results);
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
            }
        } else {
            var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
        }
    },
    function (session, results) {
        if (results.response) {
            if (checkNumber(results) != '') {
                session.send(checkNumber(results));
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
                // builder.Prompts.number(session, sendTextPrompt(session));    
            } else {
                setConversationData(session, results);
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
                // builder.Prompts.number(session, sendTextPrompt(session));
            }
        } else {
            var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
            // builder.Prompts.number(session, sendTextPrompt(session));
        }
    },
    function (session, results) {
        if (results.response) {
            if (checkNumber(results) != '') {
                session.send(checkNumber(results));
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
                // builder.Prompts.number(session, sendTextPrompt(session));    
            } else {
                setConversationData(session, results);
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
                // builder.Prompts.number(session, sendTextPrompt(session));
            }
        } else {
            var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
            // builder.Prompts.number(session, sendTextPrompt(session));
        }
    },
    function (session, results) {
        if (results.response) {
            if (checkNumber(results) != '') {
                session.send(checkNumber(results));
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
                // builder.Prompts.number(session, sendTextPrompt(session));    
            } else {
                setConversationData(session, results);
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
                // builder.Prompts.number(session, sendTextPrompt(session));
            }
        } else {
            var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
            // builder.Prompts.text(session, sendTextPrompt(session));
        }  
    },
    function (session, results) {
        if (results.response) {
            if (checkNumber(results) != '') {
                session.send(checkNumber(results));
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
                // builder.Prompts.number(session, sendTextPrompt(session));    
            } else {
                setConversationData(session, results);
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
                // builder.Prompts.number(session, sendTextPrompt(session));
            }
        } else {
            var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
            // builder.Prompts.number(session, sendTextPrompt(session));
        }
    },
    function (session, results) {
        if (results.response) {
            setConversationData(session, results);
                var headers = {
                    'content-type':'application/json'
                }
                helperFunction.hitAPI('POST', '/employee', session.conversationData, headers, function (err, response) {
                    if (err) {
                        console.log(err);  
                    } 
                    if (response.error) {
                        session.send(response.message).endConversation();     
                    } else {
                        session.send('Thank you for the KPI Evaluation.').endConversation(); 
                    }
                });
        }
    }
]);

bot.dialog('tl', [
    function (session) { 
            session.conversationData.productivityAndQuality = {};
            builder.Prompts.choice(session,
                'Can you Please fill up your KPI through KPI BOT.',
                ['Yes', 'No'],
                { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        if (results.response.entity.toLowerCase() == 'yes') {
            var card = {
                'contentType': 'application/vnd.microsoft.card.adaptive',
                'content': {
                    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
                    'type': 'AdaptiveCard',
                    'version': '1.0',
                    'speak': 'Rating should be given on the scale of 10, in which 10 is the Top most and 0 is the Least.',
                    'body': [
                        {
                            'type': 'Container',
                            'speak': 'Rating should be given on the scale of 10, in which 10 is the Top most and 0 is the Least.Rating is given as per the defined rule:(0-2:Poor,3-4:Unsatisfactory,5-6:Average,text,7-8:Good,9-10:Excellent)',
                            'items': [
                                {
                                    'type': 'ColumnSet',
                                    'columns': [
                                        {
                                            'type': 'Column',
                                            'size': 'stretch',
                                            'items': [
                                                {
                                                    'type': 'TextBlock',
                                                    'text': 'Rating should be given on the scale of 10, in which 10 is the Top most and 0 is the Least.',
                                                    'weight': 'bolder',
                                                    'isSubtle': true,
                                                    'wrap': true
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': 'Rating is given as per the defined rule:',
                                                    'weight': 'bolder',
                                                    'isSubtle': true
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': '0-2:Poor',
                                                    'wrap': true
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': '3-4:Unsatisfactory',
                                                    'wrap': true
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': '5-6:Average',
                                                    'wrap': true
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': '7-8:Good',
                                                    'wrap': true
                                                },
                                                {
                                                    'type': 'TextBlock',
                                                    'text': '9-10:Excellent',
                                                    'wrap': true
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            };
            var msg = new builder.Message(session)
                .addAttachment(card);
            session.send(msg);
            var promptCard = makeAdaptiveCard('What\'s your name: ', 'What\'s your name: ');
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.text(session, msg);
        } else if (results.response.entity.toLowerCase() == 'no') {
            session.send('May be another time.').endDialog();
        } else {
            session.send('I am learning day by day, but this time i don\'t understand what you are saying.');
            session.send('So, Please Enter Yes or No');
        }
    },
    function (session, results) {
        if (results.response) {
            session.conversationData.tlname = results.response;
            var options = {
                method: 'GET',
                url: process.env.API_URL +'/employee/'+session.conversationData.tlname
            };

            request(options, function (err, response, body) {
                if (err) {
                     console.log(err);
                }
                
                body = JSON.parse(body);
                if (body.error) {
                    session.send(body.message).endConversation();
                }
                if (!body.error && body.data.length > 0) {
                    var employeeName = body.data.map(function (value) {
                        return value.name + '(' + value.employeeId + ')';
                    });
                    builder.Prompts.choice(
                        session,
                        'Choose your team member? ',
                        employeeName,
                        { listStyle: builder.ListStyle.button }
                    );    
                } else {
                    session.send('Look like nobody has filled the KPI Evaluation form yet.').endConversation();
                }
                
            });
        } else {
            var promptCard = makeAdaptiveCard('What\'s your name: ', 'What\'s your name: ');
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.text(session, msg);
      }  
    },
    function (session, results) {
        if (results.response) {
            session.conversationData.name = results.response.entity.split('(')[0];
            session.conversationData.employeeId = results.response.entity.split('(')[1].split(')')[0];
            session.conversationData.reportTo = session.conversationData.tlname;
            var options = {
                method: 'GET',
                url: process.env.API_URL + '/employee/record/' + session.conversationData.employeeId
            };
            request(options, function (err, response, body) {
                if (err) {
                    return console.log(err);
                }

                body = JSON.parse(body);
                session.conversationData.employeeRating = body.data;
                var promptCard = makeAdaptiveCard('Productivity & Quality', 'Productivity & Quality');
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                session.send(msg);
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.text(session, msg);
            });
            
        } else {
            var promptCard = makeAdaptiveCard('What\'s your Employee Id: ', 'What\'s your Employee Id: ');
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
        }
    },
    function (session, results) {
        if (results.response) {
            if (checkNumber(results) != '') {
                session.send(checkNumber(results));
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
            } else {
                setConversationData(session, results);
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
            }
        } else {
            var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
        }
    },
    function (session, results) {
        if (results.response) {
            if (checkNumber(results) != '') {
                session.send(checkNumber(results));
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
            } else {
                setConversationData(session, results);
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
            }
        } else {
            var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
        }
    },
    function (session, results) {
        if (results.response) {
            if (checkNumber(results) != '') {
                session.send(checkNumber(results));
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
            } else {
                setConversationData(session, results);
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
            }
        } else {
            var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
        }
    },
    function (session, results) {
        if (results.response) {
            if (checkNumber(results) != '') {
                session.send(checkNumber(results));
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
            } else {
                setConversationData(session, results);
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
            }
        } else {
            var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
        }  
    },
    function (session, results) {
        if (results.response) {
            if (checkNumber(results) != '') {
                session.send(checkNumber(results));
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
            } else {
                setConversationData(session, results);
                var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
                var msg = new builder.Message(session)
                    .addAttachment(promptCard);
                builder.Prompts.number(session, msg);
            }
        } else {
            var promptCard = makeAdaptiveCard(sendTextPrompt(session), sendTextPrompt(session));
            var msg = new builder.Message(session)
                .addAttachment(promptCard);
            builder.Prompts.number(session, msg);
        }
    },
    function (session, results) {
        if (results.response) {
            setConversationData(session, results);
                var headers = {
                    'content-type':'application/json'
                }
                helperFunction.hitAPI('POST', '/teamLeader', session.conversationData, headers, function (err, response) {
                    if (err) {
                        console.log(err);  
                    } 
                    if (response.error) {
                        session.send(response.message).endConversation();
                    } else {
                        session.send('Thank you for the KPI Evaluation.').endConversation();
                    }
                });
        }
    }
]);

//=========================================================
// Bots Events
//=========================================================

// Sends greeting message when the bot is first added to a conversation
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                var reply = new builder.Message()
                    .speak('Welcome to Kpi Bot')    
                    .address(message.address)
                    .text('Welcome to Kpi Bot.');
                bot.send(reply);
            }
        });
    }
});

function setConversationData(session, results) {
    var productivityAndQuality = [
        'codingEffciency',
        'Ownership',
        'reviewEffectiveness',
        'requirementUnderstanding',
        'codeComment',
        'mitigation'
    ];

    for (var i = 0; i <= productivityAndQuality.length - 1; i++) {
        if (!session.conversationData.productivityAndQuality[productivityAndQuality[i]]) {
            session.conversationData.productivityAndQuality[productivityAndQuality[i]] = results.response;
            break;
        }
    }
}

function sendTextPrompt(session) {
    var productivityAndQuality = [
        'codingEffciency',
        'Ownership',
        'reviewEffectiveness',
        'requirementUnderstanding',
        'codeComment',
        'mitigation'
    ];
    var textPrompt = [
        'Coding efficiency (Unbloated coding): ',
        'Hitting target with accurate status reporting(Ownership): ',
        'Unit Testing (Bug free development) (Review effectiveness): ',
        'Understanding of requirement: ',
        'Defect / Review Comments density: ',
        'Proactive risk identification / mitigation: '
    ];
    var returnText = '';
    var key = '';
    for (var i = 0; i <= productivityAndQuality.length - 1; i++) {
        if (!session.conversationData.productivityAndQuality[productivityAndQuality[i]]) {
            key = productivityAndQuality[i];
            returnText = textPrompt[i];
            break;
        }
    }
    console.log(key);
    if (session.conversationData.employeeRating) {
        console.log(session.conversationData.employeeRating.productivityAndQuality);
        returnText += '\n' + session.conversationData.name + ' : ' + session.conversationData.employeeRating.productivityAndQuality[key];
    }
    return returnText;
}

function checkNumber(results) {
    if (results.response > 10) {
        return 'Please give the rating from 0-10.';
    } else {
        return '';
    }
}

function makeAdaptiveCard(speak,text) {
    var promptCard = {
        'contentType': 'application/vnd.microsoft.card.adaptive',
        'content': {
            '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
            'type': 'AdaptiveCard',
            'version': '1.0',
            'speak': speak,
            'body': [
                {
                    'type': 'Container',
                    'items': [
                        {
                            'type': 'ColumnSet',
                            'columns': [
                                {
                                    'type': 'Column',
                                    'size': 'stretch',
                                    'items': [
                                        {
                                            'type': 'TextBlock',
                                            'text': text,
                                            'weight': 'bolder',
                                            'isSubtle': true,
                                            'wrap': true
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    };
    return promptCard;
}