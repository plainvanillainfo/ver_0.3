
const { ClassesCommon, UseCasesCommon } = require('plainvanillainfo/pvimeta');
const fs = require('fs');

class Application {
    constructor(config) {
        this.config = config;
    }

    createClasses() {
        let classesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'classes.cjs'));
        console.log(ClassesCommon);
        console.log(classesApplication);
    }

    createUseCases() {
        let useCasesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'use_cases.cjs'));
        console.log(UseCasesCommon);
        console.log(useCasesApplication);
    }

}

module.exports = {
    Application: Application
}
