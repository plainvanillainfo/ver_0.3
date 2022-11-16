
const { ClassesCommon } = require('../pvimeta/classes.cjs');
const { UseCasesCommon } = require('../pvimeta/use_cases.cjs');
const fs = require('fs');

class Application {
    constructor(config) {
        this.config = config;
    }

    createClasses() {
        let classesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'classes.cjs'));
        let useCasesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'use_cases.cjs'));
    }
}

module.exports = {
    Application: Application
}
