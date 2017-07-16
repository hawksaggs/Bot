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

var questions = [];
var generalQuestions = [
    { field: 'name', value: 'What\'s your name ?' },
    { field: 'employeeId', value: 'What\'s your EmployeeId ?' }
]

bot.dialog('/', [
    function (session) {
        session.say('Hello');
        var options = {
            method: 'GET',
            url: process.env.API_URL + '/kpi-param'
        };
        request(options, function (error, response, body) {
            if (error) {
                console.log(error);
            }
            // console.log(body);
            if (body) {
                body = JSON.parse(body);
                questions = body.data.productivityAndQuality;
                console.log(questions);
            }
            builder.Prompts.choice(session,
                'Are you Employee or TL? ',
                ['Employee', 'TL'],
                { listStyle: builder.ListStyle.button });
        });
    },
    function (session, results) {
        session.conversationData.type = results.response.entity.toLowerCase();
        session.beginDialog('start');
    }
]);

bot.dialog('start', [
    function (session) {
        builder.Prompts.choice(session,
            'Can you Please fill up your KPI through KPI BOT.',
            ['Yes', 'No'],
            { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        if (results.response.entity.toLowerCase() == 'yes') {
            session.send('Rating should be given on the scale of 10, in which 10 is the Top most and 0 is the Least.Rating is given as per the defined rule:(0-2:Poor,3-4:Unsatisfactory,5-6:Average,text,7-8:Good,9-10:Excellent)');
            if (session.conversationData.type == 'employee') {
                session.beginDialog('generalQuestion');
            } else {
                session.beginDialog('TL');
            }

        } else if (results.response.entity.toLowerCase() == 'no') {
            session.send('May be another time.').endDialog();
        } else {
            session.send('I am learning day by day, but this time i don\'t understand what you are saying.');
            session.send('So, Please Enter Yes or No');
        }
    }
]);

bot.dialog('generalQuestion', [
    function (session, args) {

        // Save previous state (create on first call)

        session.dialogData.generalIndex = args ? args.generalIndex : 0;

        session.dialogData.form = args ? args.form : {};


        // Prompt user for next field

        builder.Prompts.text(session, generalQuestions[session.dialogData.generalIndex].value);

    },

    function (session, results) {

        // Save users reply

        var field = generalQuestions[session.dialogData.generalIndex++].field;

        session.dialogData.form[field] = results.response;



        // Check for end of form

        if (session.dialogData.generalIndex >= generalQuestions.length) {

            // Return completed form
            session.conversationData.name = session.dialogData.form.name;
            session.conversationData.employeeId = session.dialogData.form.employeeId;

            if (session.conversationData.type == 'employee') {
                session.beginDialog('employee');
            } else if (session.conversationData.type == 'tl') {
                session.beginDialog('TL');
            } else {
                session.replaceDialog('/', { isReprompt: true });
            }

        } else {

            // Next field

            session.replaceDialog('generalQuestion', session.dialogData);

        }

    }
]);

bot.dialog('employee', [
    function (session, args) {
        session.dialogData.index = args ? args.index : 0;

        session.dialogData.employee = args ? args.employee : {};
        session.dialogData.employee.productivityAndQuality = args ? args.employee.productivityAndQuality : {};
        session.dialogData.employee.weightage = args ? args.employee.weightage : {};

        // Prompt user for next field

        builder.Prompts.text(session, questions[session.dialogData.index].value);
    },
    function (session, results) {

        // Save users reply


        var numberCheck = checkNumber(results);
        console.log(numberCheck);
        if (!numberCheck) {
            var field = questions[session.dialogData.index++].field;
            session.dialogData.employee.productivityAndQuality[field] = results.response;
            session.dialogData.employee.weightage[field] = questions[(session.dialogData.index - 1)].weightage;

        } else {
            // Next field
            session.send(numberCheck);
            // session.replaceDialog('employee', session.dialogData);
        }


        // Check for end of form

        if (session.dialogData.index >= questions.length) {

            // Return completed form
            // console.log(session.dialogData);
            session.conversationData.employee = session.dialogData.employee;
            var headers = {
                'content-type': 'application/json'
            }
            helperFunction.hitAPI('POST', '/employee', session.conversationData, headers, function (err, response) {
                if (err) {
                    console.log(err);
                }
                console.log(response);
                if (response.error) {
                    session.send(response.message).endConversation();
                } else {
                    session.send('Thank you for the KPI Evaluation.').endConversation();
                }
            });
        } else {

            // Next field

            session.replaceDialog('employee', session.dialogData);

        }
    }
]);

bot.dialog('TL', [
    function (session) {
        builder.Prompts.text(session, 'What\'s your name: ');
    },
    function (session, results) {
        session.conversationData.tlname = results.response;
        var options = {
            method: 'GET',
            url: process.env.API_URL + '/employee/' + session.conversationData.tlname
        };

        request(options, function (err, response, body) {
            if (err) {
                console.log(err);
            }
            if (typeof body == 'string') {
                body = JSON.parse(body);    
            }
            
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
    },
    function (session, results) {
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
            session.conversationData.employeeRating.rating = {};
            for (var i = 0; i < body.data.productivityAndQuality.length; i++){
                session.conversationData.employeeRating.rating[body.data.productivityAndQuality[i].field] = body.data.productivityAndQuality[i].employee; 
            }
            session.beginDialog('TLEnd');
        });
    },
]);

bot.dialog('TLEnd', [
    function (session, args) {
        session.dialogData.index = args ? args.index : 0;

        session.dialogData.tl = args ? args.tl : {};
        session.dialogData.tl.productivityAndQuality = args ? args.tl.productivityAndQuality : {};
        session.dialogData.tl.remark = args ? args.tl.remark : {};

        // Prompt user for next field

        builder.Prompts.text(session, questions[session.dialogData.index].value + ': ' + session.conversationData.employeeRating.name + ' : ' + session.conversationData.employeeRating.rating[questions[session.dialogData.index].field]);
    },
    function (session, results) {

        // Save users reply
        var numberCheck = checkNumber(results);

        if (!numberCheck) {
            var field = questions[session.dialogData.index++].field;
            session.dialogData.tl.productivityAndQuality[field] = results.response;
            builder.Prompts.choice(session,
                'Any Remarks ?',
                ['Yes', 'No'],
                { listStyle: builder.ListStyle.button });
        } else {
            // Next field
            session.send(numberCheck);
        }
    },
    function (session, results) {
        if (results.response.entity.toLowerCase() == 'yes') {
            builder.Prompts.text(session,'Remarks: ');
        } else {
            if (session.dialogData.index >= questions.length) {

                // Return completed form
                session.conversationData.tl = session.dialogData.tl;

                var headers = {
                    'content-type': 'application/json'
                }
                helperFunction.hitAPI('POST', '/teamLeader', session.conversationData, headers, function (err, response) {
                    if (err) {
                        console.log(err);
                    }
                    console.log(response);
                    if (response.error) {
                        session.send(response.message).endConversation();
                    } else {
                        session.send('Thank you for the KPI Evaluation.').endConversation();
                    }
                });
            } else {

                // Next field
                session.replaceDialog('TLEnd', session.dialogData);

            }    
        }
    },
    function (session, results) {
        // Check for end of form
        if (results.response) {
            var field = questions[(session.dialogData.index -1)].field;
            session.dialogData.tl.remark[field] = results.response;
        }
        if (session.dialogData.index >= questions.length) {

            // Return completed form
            session.conversationData.tl = session.dialogData.tl;

            var headers = {
                'content-type': 'application/json'
            }
            helperFunction.hitAPI('POST', '/teamLeader', session.conversationData, headers, function (err, response) {
                if (err) {
                    console.log(err);
                }
                console.log(response);
                if (response.error) {
                    session.send(response.message).endConversation();
                } else {
                    session.send('Thank you for the KPI Evaluation.').endConversation();
                }
            });
        } else {

            // Next field
            session.replaceDialog('TLEnd', session.dialogData);

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

function makeAdaptiveCard(speak, text) {
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

var questions = [

    { field: 'name', prompt: "What's your name?" },

    { field: 'age', prompt: "How old are you?" },

    { field: 'state', prompt: "What state are you in?" }

];
