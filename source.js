"use strict";

var Botkit = require('botkit'),
    moduleLoader = require('bot/common/module-loader'),
    teambot = require('bot'),
    descriptionsHelper = require('bot/common/description-helper');

var Conversation = function (controller) {

    var hello = function (bot, message) {

        bot.api.reactions.add({
            timestamp: message.ts,
            channel: message.channel,
            name: 'robot_face',
        }, function (err, res) {
            if (err) {
                bot.botkit.log('Failed to add emoji reaction :(', err);
            }
        });


        controller.storage.users.get(message.user, function (err, user) {
            if (user && user.name) {
                bot.reply(message, 'Hello ' + user.name + '!!');
            } else {
                bot.reply(message, 'Hello.');

                bot.startConversation(message, function (err, convo) {

                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function (response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [{
                            pattern: bot.utterances.yes,
                            callback: function (response, convo) {
                                // since no further messages are queued after this,
                                // the conversation will end naturally with status == 'completed'
                                convo.next();
                            }
                        },
                        {
                            pattern: bot.utterances.no,
                            callback: function (response, convo) {
                                // stop the conversation. this will cause it to end with status == 'stopped'
                                convo.stop();
                            }
                        },
                        {
                            default: true,
                            callback: function (response, convo) {
                                convo.repeat();
                                convo.next();
                            }
                        }
                        ]);

                        convo.next();

                    }, { 'key': 'nickname' }); // store the results in a field called nickname

                    convo.say('Nice to meet you!');

                        convo.ask('Tell me your GitHub username, please?', function (response, convo) {
                        convo.ask('Your Github username is `' + response.text + '`?', [{
                            pattern: bot.utterances.yes,
                            callback: function (response, convo) {
                                // since no further messages are queued after this,
                                // the conversation will end naturally with status == 'completed'
                                convo.next();
                            }
                        },
                        {
                            pattern: bot.utterances.no,
                            callback: function (response, convo) {
                                // stop the conversation. this will cause it to end with status == 'stopped'
                                convo.stop();
                            }
                        },
                        {
                            default: true,
                            callback: function (response, convo) {
                                convo.repeat();
                                convo.next();
                            }
                        }
                        ]);

                        convo.next();

                    }, { 'key': 'githubUsername' }); // store the results in a field called nickname

                    convo.on('end', function (convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function (err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                user.githubUsername = convo.extractResponse('githubUsername');
                                controller.storage.users.save(user, function (err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + '!');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });

                });
            }
        });
    },

        callMe = function (bot, message) {
            var name = message.match[1];
            controller.storage.users.get(message.user, function (err, user) {
                if (!user) {
                    user = {
                        id: message.user,
                    };
                }
                user.name = name;
                controller.storage.users.save(user, function (err, id) {
                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                });
            });
        },

        whoAmI = function (bot, message) {
            controller.storage.users.get(message.user, function (err, user) {
                if (user && user.name) {
                    bot.reply(message, 'Your name is ' + user.name);
                } else {
                    bot.startConversation(message, function (err, convo) {
                        if (!err) {
                            convo.say('I do not know your name yet!');
                            convo.ask('What should I call you?', function (response, convo) {
                                convo.ask('You want me to call you `' + response.text + '`?', [{
                                    pattern: bot.utterances.yes,
                                    callback: function (response, convo) {
                                        // since no further messages are queued after this,
                                        // the conversation will end naturally with status == 'completed'
                                        convo.next();
                                    }
                                },
                                {
                                    pattern: bot.utterances.no,
                                    callback: function (response, convo) {
                                        // stop the conversation. this will cause it to end with status == 'stopped'
                                        convo.stop();
                                    }
                                },
                                {
                                    default: true,
                                    callback: function (response, convo) {
                                        convo.repeat();
                                        convo.next();
                                    }
                                }
                                ]);

                                convo.next();

                            }, { 'key': 'nickname' }); // store the results in a field called nickname

                            convo.on('end', function (convo) {
                                if (convo.status == 'completed') {
                                    bot.reply(message, 'OK! I will update my dossier...');

                                    controller.storage.users.get(message.user, function (err, user) {
                                        if (!user) {
                                            user = {
                                                id: message.user,
                                            };
                                        }
                                        user.name = convo.extractResponse('nickname');
                                        controller.storage.users.save(user, function (err, id) {
                                            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                        });
                                    });



                                } else {
                                    // this happens if the conversation ended prematurely for some reason
                                    bot.reply(message, 'OK, nevermind!');
                                }
                            });
                        }
                    });
                }
            });
        },

        restartMe = function (bot, message) {
            bot.reply(message, 'ok i will take a break for a second');
            teambot.restart();
        },

        loadExternalIntegration = function (bot, message) {
            bot.startConversation(message, function (err, convo) {
                if (!err) {
                    convo.say('Hello there! Currently we support external integration only with https://github.com');
                    convo.ask('Just give me your repositoy URL', function (response, convo) {
                        convo.ask('Is that the correct github url `' + response.text + '`?', [{
                            pattern: bot.utterances.yes,
                            callback: function (response, convo) {
                                // since no further messages are queued after this,
                                // the conversation will end naturally with status == 'completed'
                                convo.next();
                            }
                        },
                        {
                            pattern: bot.utterances.no,
                            callback: function (response, convo) {
                                // stop the conversation. this will cause it to end with status == 'stopped'
                                convo.stop();
                            }
                        },
                        {
                            default: true,
                            callback: function (response, convo) {
                                convo.repeat();
                                convo.next();
                            }
                        }
                        ]);

                        convo.next();

                    }, { 'key': 'githubUrl' }); // store the results in a field called githubUrl


                    convo.on('end', function (convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will add your integration.');
                            var githubUrl = convo.extractResponse('githubUrl');
                            githubUrl = githubUrl.substring(1, githubUrl.length - 1);
                            moduleLoader.loadGithubRepository(githubUrl, function () {
                                bot.reply(message, 'Got it. You can start using the new integrations in seconds ');
                                teambot.restart();
                            });
                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        },

        whatCanYouDo = function (bot, message) {
            bot.startConversation(message, function (err, convo) {
                if (!err) {
                    convo.say('Hello there! Currently I have the following integrations:');
                    var integrations = descriptionsHelper.getAllDescriptions();
                    integrations.forEach(function (integration) {
                        convo.say(integration.name + ' (' + integration.description + '). Supported terms:');
                        // convo.say(' ');
                        var result = '```';
                        integration.commands.forEach(function (command){
                           result += command.usage + '\n';
                        });
                        result += '```';
                        convo.say(result);
                    });

                    convo.say('Supported turns should be part of your conversation request.')
                }
            });
        };

    return {
        hello: hello,
        callMe: callMe,
        whoAmI: whoAmI,
        restartMe: restartMe,
        loadExternalIntegration: loadExternalIntegration,
        whatCanYouDo: whatCanYouDo
    };
};

module.exports = Conversation;