
const { log, biglog, errorlog, colorize } = require("./out");
const model = require('./model');


exports.helpCmd = rl => {
    log("Comandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log("  add - Añadir un nuevo quiz interactivamente.");
    log("  delete <id> - Borrar ek quiz indicado.");
    log("  edit <id> - Editar el quiz indicado.");
    log("  test <id> - Probar el quiz indicado.");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};

exports.listCmd = rl => {

    model.getAll().forEach((quiz, id) => {
        log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
    });
    rl.prompt();
};

exports.showCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch (error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
};

exports.addCmd = (rl) => {
    rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
        rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
            model.add(question, answer);
            log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();
        });
    });
};

exports.deleteCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            model.deleteByIndex(id);
        } catch (error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
};

exports.editCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => { rl.write(quiz.question) }, 0);

            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => { rl.write(quiz.answer) }, 0);

                rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por : ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};

exports.testCmd = (rl, id) => {

    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {

            const quiz = model.getByIndex(id);

            rl.question(`${out.colorize(quiz.question+'?', 'cyan')}    `, answer => {

                if(answer.trim().toLowerCase() === quiz.answer.toLowerCase()){
                    console.log('Su respuesta es correcta. ');
                    out.biglog('Correcta', 'green');
                } else {
                    console.log('Su respuesta es incorrecta. ');
                    out.biglog('Incorrecta', 'red');
                }

                rl.prompt();
});

        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};

exports.playCmd = (rl) => {
    let score = 0;
    let toBeResolved = [];
    const quizzes = model.getAll();
    for (let i = 0; i < quizzes.length; i++) {
        toBeResolved.push(i);

    }

    const playOne = () => {

        if (toBeResolved.length === 0) {
            out.log(' Ya ha respondido a todas las preguntas :) ', 'green');
            console.log(' Fin del examen. Aciertos:')
            out.biglog(`${score}`, "magenta");
            rl.prompt();

        } else {

            let id = Math.floor(Math.random() * (toBeResolved.length));

            const quiz = quizzes[toBeResolved[id]];
            toBeResolved.splice(id, 1);

            rl.question(`${out.colorize(quiz.question + '?', 'cyan')}   `, answer => {

                if (answer.trim().toLowerCase() === quiz.answer.toLowerCase()) {
                    score = score + 1;
                    console.log(` ${out.colorize('CORRECTO', 'green')} - Lleva ${out.colorize(score, 'green')} aciertos`);
                    playOne();

                } else {
                    out.log(' INCORRECTO', 'red');
                    console.log(' Fin del examen. Aciertos:')
                    out.biglog(`${score}`, "magenta");
                    rl.prompt();
                }
            });
        }
    }

    playOne();

};

exports.creditsCmd = (rl) => {
    log('Autores de la práctica:');
    log('SERGIO TURIÑO ESCOBAR', 'green');
    rl.prompt();
};

exports.quitCmd = (rl) => {
    rl.close();
    rl.prompt();
};

