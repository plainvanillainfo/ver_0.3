
const { ClassesCommon, UseCasesCommon } = require('plainvanillainfo/pvimeta');
const fs = require('fs');

class Application {
    constructor(config) {
        this.config = config;
    }

    createClasses() {
        let classesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'classes.cjs'));
        let classes = [...ClassesCommon, ...classesApplication];
        console.log(classes);
    }

    createUseCases() {
        let useCasesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'use_cases.cjs'));
        let useCases = [...UseCasesCommon, ...useCasesApplication];
        console.log(useCases);
    }

}

module.exports = {
    Application: Application
}
