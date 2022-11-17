
const { ClassesCommon, UseCasesCommon } = require('plainvanillainfo/pvimeta');
const fs = require('fs');

class Application {
    constructor(config) {
        this.config = config;
        this.sqlScriptTables = '';
    }

    createClasses() {
        let classesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'classes.cjs'));
        let classes = [...ClassesCommon, ...classesApplication];
        console.log(classes);
        classes.forEach(classCur => {
			this.createTable(classCur);
        });
        console.log(this.sqlScriptTables);
    }
    
    createTable(classInfo) {
		if (classInfo.Base != null && classInfo.Base > '') {
		} else {
			this.sqlScriptTables += 'CREATE TABLE data."' + classInfo.Name + '" (\n';
			classInfo.Components.forEach((componentCur, componentIndex) => {
				if (componentCur.Type != null ) {
					this.sqlScriptTables += '    "' + componentCur.Name + '" ';
					switch (componentCur.Type.toLowerCase()) {
						case 'varchar':
							this.sqlScriptTables += 'character varying';
							if (componentCur.Length != null) {
								this.sqlScriptTables += ('(' + componentCur.Length + ')');
							}
							break;
						case 'smallint':
							this.sqlScriptTables += 'smallint';
							break;
						case 'integer':
							this.sqlScriptTables += 'integer';
							break;
						case 'bigint':
							this.sqlScriptTables += 'bigint';
							break;
						case 'uuid':
							this.sqlScriptTables += 'uuid';
							break;
						case 'json':
							this.sqlScriptTables += 'json';
							break;
						case 'timestamp':
							this.sqlScriptTables += 'timestamp with time zone DEFAULT clock_timestamp()';
							break;
					}
					this.sqlScriptTables += ',\n';
				}
			});
			classInfo.References.forEach((referenceCur, referenceIndex) => {
				this.sqlScriptTables += '    "' + referenceCur.Name + '" ';
				this.sqlScriptTables += 'uuid not null ,\n';
			});
			;
			this.sqlScriptTables = this.sqlScriptTables.slice(0, -2) + '\n);\n';
		}
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
