
const { ClassesCommon } = require('plainvanillainfo/pvimeta/classes.cjs');
const { UseCasesCommon } = require('plainvanillainfo/pvimeta/use_cases.cjs');
const fs = require('fs');

class Application {
    constructor(config) {
        this.config = config;
    }

    createClasses() {
        let classesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'classes.cjs'));
        let useCasesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'use_cases.cjs'));

        console.log(ClassesCommon);
        console.log(classesApplication);
        console.log(UseCasesCommon);
        console.log(useCasesApplication);
    }
}

module.exports = {
    Application: Application
}
