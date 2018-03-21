
const { log, biglog, errorlog, colorize } = require("./out");
const { models } = require('./model');
const Sequelize = require('sequelize');


exports.helpCmd = (socket, rl) => {
    log(socket, "Comandos:");
    log(socket, "  h|help - Muestra esta ayuda.");
    log(socket, "  list - Listar los quizzes existentes.");
    log(socket, "  show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log(socket, "  add - Añadir un nuevo quiz interactivamente.");
    log(socket, "  delete <id> - Borrar ek quiz indicado.");
    log(socket, "  edit <id> - Editar el quiz indicado.");
    log(socket, "  test <id> - Probar el quiz indicado.");
    log(socket, "  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket, "  credits - Créditos.");
    log(socket, "  q|quit - Salir del programa.");
    rl.prompt();
};

exports.listCmd = (socket, rl) => {

    models.quiz.findAll()
        .each(quiz => {
            log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        })
};

const validateId = id => {
    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parametro <id>.`));
        } else {
            id = parseInt(id);
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un número.`));
            } else {
                resolve(id);
            }
        }
    });
};

exports.showCmd = (socket, rl, id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        })
};

const makeQuestion = (rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};

exports.addCmd = (socket, rl) => {
    makeQuestion(rl, ' Introduzca una pregunta: ')
        .then(q => {
            return makeQuestion(rl, ' Introduzca la respuesta ')
                .then(a => {
                    return { question: q, answer: a };
                });
        })
        .then(quiz => {
            return models.quiz.create(quiz);
        })
        .then((quiz) => {
            log(socket, ` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es erroneo:');
            error.errors.forEach(({ message }) => errorlog(message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

exports.deleteCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.destroy({ where: { id } }))
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

exports.editCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }

            process.stdout.isTTY && setTimeout(() => { rl.write(quiz.question) }, 0);
            return makeQuestion(rl, ' Introduzca la pregunta: ')
                .then(q => {
                    process.stdout.isTTY && setTimeout(() => { rl.write(quiz.answer) }, 0);
                    return makeQuestion(rl, ' Introduzca la respuesta ')
                        .then(a => {
                            quiz.question = q;
                            quiz.answer = a;
                            return quiz;
                        });
                });
        })
        .then(quiz => {
            return quiz.save();
        })
        .then(quiz => {
            log(socket, ` Se ha cambiado el quiz ${colorize(id, 'magenta')} por : ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es erroneo:');
            error.errors.forEach(({ message }) => errorlog(message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

exports.testCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) { throw new Error(`No existe un quiz asociado al id=${id}.`); }
            rl.question(colorize(`${quiz.question}` + '? ', 'red'), answer => {
                const resp = answer.toLowerCase().trim();
                const respBuena = quiz.answer.toLowerCase().trim();
                if (resp === respBuena) {
                    log(socket, 'Su repuesta es correcta. ');
                    biglog(socket, 'CORRECTA', 'green');
                    rl.prompt();
                }
                else {
                    log(socket, 'Su respuesta es incorrecta. ');
                    biglog(socket, 'INCORRECTA', 'red');
                    rl.prompt();
                };
                rl.prompt();
            });
        })

        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es erroneo:');
            error.errors.forEach(({ message }) => errorlog(message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });

};


exports.playCmd = (socket, rl) => {
    let score = 0;
    let toBeResolved = [];
    let todasPreguntas = [];
    models.quiz.findAll()
        .each(result => {
            todasPreguntas.push(result);
        })
        .then(() => {

            for (let i = 0; i < todasPreguntas.length; i++) {

                toBeResolved.push(i);
            }


            const playOne = () => {


                if (toBeResolved.length === 0) {
                    log(socket, ' Ya ha respondido a todas las preguntas ', 'green');
                    log(socket, ' Fin del examen. Aciertos:')
                    biglog(socket, `${score}`, "magenta");
                    rl.prompt();

                } else {

                    let idAzar = Math.floor(Math.random() * (toBeResolved.length));
                    const pregunta = todasPreguntas[toBeResolved[idAzar]];
                    toBeResolved.splice(idAzar, 1);                    
                    rl.question(colorize(`${pregunta.question}` + '? ', 'red'), answer => {

                        if (answer.trim().toLowerCase() === pregunta.answer.toLowerCase()) {
                            score = score + 1;
                            log(socket, ` ${colorize('CORRECTO', 'green')} - Lleva ${colorize(score, 'green')} aciertos`);
                            playOne();

                        } else {
                            log(socket, ' INCORRECTO', 'red');
                            log(socket, ' Fin del examen. Aciertos:')
                            biglog(socket, `${score}`, "magenta");
                            rl.prompt();
                        }
                    });
                }
            }
            playOne();

        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es erroneo:');
            error.errors.forEach(({ message }) => errorlog(socket, message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

exports.creditsCmd = (socket, rl) => {
    log(socket, 'Autores de la práctica:');
    log(socket, 'SERGIO TURIÑO ESCOBAR', 'green');
    rl.prompt();
};

exports.quitCmd = (socket, rl) => {
    rl.close();
    socket.end
    rl.prompt();
};

