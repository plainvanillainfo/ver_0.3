
const { ClassesCommon, UseCasesCommon } = require('plainvanillainfo/pvimeta');
const fs = require('fs');
const jsesc = require("jsesc");

class Application {
    constructor(config) {
        this.config = config;
        this.classes = [];
        this.classesAll = [];
        this.useCases = [];
        this.users = [];
        this.entitlements = [];
        this.sqlScriptData = 'CREATE SCHEMA IF NOT EXISTS data;\n';
        this.sqlScriptFunctionality = 'CREATE SCHEMA IF NOT EXISTS functionality;\n';
        this.sqlScriptAuthorization = 'CREATE SCHEMA IF NOT EXISTS authorization;\n';
        this.sqlScriptExecution = 'CREATE SCHEMA IF NOT EXISTS execution;\n';
    }

    createClasses() {
        let classesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'classes.cjs'));
        this.classes = [...ClassesCommon, ...classesApplication];
        this.classes.forEach((classCur) => {
            this.deepen(classCur);
        });
        console.log(this.classes, "\n");
        this.classes.forEach(classCur => {
            if (classCur.Base == null || classCur.Base === '') {
			    this.createTable(classCur, null);
            }
        });
        this.classes.forEach(classCur => {
            if (classCur.Base == null || classCur.Base === '') {
                this.createTablePrimaryKey(classCur);
            }
        });
        this.classes.forEach(classCur => {
            if (classCur.Base == null || classCur.Base === '') {
                this.createLinkTables(classCur);
            }
        });
        this.classes.forEach(classCur => {
            if (classCur.Base == null || classCur.Base === '') {
                this.createTableForeignKeys(classCur);
            }
        });
        console.log(this.sqlScriptData);
    }

    deepen(classInfo) {
        if (classInfo.Base != null) {
            let baseClass = this.classes.find(cur => cur.Name === classInfo.Base);
            if (baseClass != null) {
                baseClass.Extensions.push({...classInfo});
            }
        }
    }
    
    createTable(classInfo, baseClassInfo) {
        this.classesAll.push(classInfo);
        classInfo.extensionTree = {};
        if (baseClassInfo == null) {
            classInfo.tableName = classInfo.Name;
            classInfo.extensions = [];
            this.sqlScriptData += 'CREATE TABLE data."' + classInfo.Name + '" (\n';
            this.sqlScriptData += '    "Id" uuid NOT NULL,\n';
            this.sqlScriptData += '    "Extension" json NOT NULL,\n';
        } else {
            classInfo.tableName = baseClassInfo.tableName;
            classInfo.extensions = [...baseClassInfo.extensions];
            classInfo.extensions.push(classInfo.Name);
        }
        classInfo.Components.forEach(componentCur => {
            if (componentCur.Type != null) {
                this.sqlScriptData += '    "' + componentCur.Name + '" ';
                switch (componentCur.Type.toLowerCase()) {
                    case 'varchar':
                        this.sqlScriptData += 'character varying';
                        if (componentCur.Length != null) {
                            this.sqlScriptData += ('(' + componentCur.Length + ')');
                        }
                        break;
                    case 'text':
                        this.sqlScriptData += 'text';
                        break;
                    case 'smallint':
                        this.sqlScriptData += 'smallint';
                        break;
                    case 'integer':
                        this.sqlScriptData += 'integer';
                        break;
                    case 'bigint':
                        this.sqlScriptData += 'bigint';
                        break;
                    case 'uuid':
                        this.sqlScriptData += 'uuid';
                        break;
                    case 'json':
                        this.sqlScriptData += 'json';
                        break;
                    case 'timestamp':
                        this.sqlScriptData += 'timestamp with time zone DEFAULT clock_timestamp()';
                        break;
                }
                this.sqlScriptData += ',\n';
            }
        });
        classInfo.References.forEach(referenceCur => {
            this.sqlScriptData += '    "' + referenceCur.Name + '" ';
            this.sqlScriptData += 'uuid not null ,\n';
        });
        classInfo.Extensions.forEach(extensionCur => {
            this.createTable(extensionCur, classInfo);
            classInfo.extensionTree[extensionCur.Name] = extensionCur.extensionTree;
        });
        if (baseClassInfo == null) {
            this.sqlScriptData = this.sqlScriptData.slice(0, -2) + '\n);\n';
            this.sqlScriptData += ('COMMENT ON TABLE data."' + classInfo.Name + '" IS \'' + JSON.stringify({ExtensionTree: classInfo.extensionTree}) + '\';\n\n');
        }
    }

    createTablePrimaryKey(classInfo) {
		this.sqlScriptData += 'ALTER TABLE ONLY data."' + classInfo.Name + 
			'" \n    ADD CONSTRAINT "' + classInfo.Name + '_pkey" PRIMARY KEY ("Id");\n';
	}

    createLinkTables(classInfo) {
        classInfo.Children.forEach(childCur => {
			let childTableName = classInfo.Name + '_CHILD_' + childCur.Name;
            let childClass = this.classesAll.find(cur => cur.Name === childCur.ChildClass);

			this.sqlScriptData += ('CREATE TABLE data."' + childTableName + '" (\n');
			this.sqlScriptData += '    "ParentId" uuid NOT NULL,\n';
			this.sqlScriptData += '    "ChildId" uuid NOT NULL\n);\n';

			this.sqlScriptData += ('ALTER TABLE ONLY data."' + childTableName + '"\n');
			this.sqlScriptData += ('    ADD CONSTRAINT "' + childCur.Name + '_pkey" ');
			this.sqlScriptData += ('PRIMARY KEY ("ParentId", "ChildId") ;\n');

			this.sqlScriptData += ('ALTER TABLE ONLY data."' + childTableName + '"\n');
			this.sqlScriptData += ('    ADD CONSTRAINT "' + classInfo.Name + '_REFERENCE" ');
			this.sqlScriptData += ('FOREIGN KEY ("ParentId") REFERENCES data."' + classInfo.tableName + '"("Id") NOT VALID;\n');

			this.sqlScriptData += ('ALTER TABLE ONLY data."' + childTableName + '"\n');
			this.sqlScriptData += ('    ADD CONSTRAINT "' + childCur.Name + '_REFERENCE" ');
			this.sqlScriptData += ('FOREIGN KEY ("ChildId") REFERENCES data."' + childClass.tableName + '"("Id") NOT VALID;\n');
		});
		classInfo.Extensions.forEach(extensionCur => {
			this.createLinkTables(extensionCur);
		});
	}

    createTableForeignKeys(classInfo) {
        classInfo.References.forEach(referenceCur => {
            let referedClass = this.classesAll.find(cur => cur.Name === referenceCur.ReferedClass);
			this.sqlScriptData += ('ALTER TABLE ONLY data."' + classInfo.tableName + '"\n');
			this.sqlScriptData += ('    ADD CONSTRAINT "' + referenceCur.Name + '_REFERENCE" ');
			this.sqlScriptData += ('FOREIGN KEY ("' + referenceCur.Name + '") REFERENCES data."' + referedClass.tableName + '"("Id") NOT VALID;\n');
        });
		classInfo.Extensions.forEach(extensionCur => {
			this.createTableForeignKeys(extensionCur);
		});
    }

    createUseCases() {
        let useCasesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'use_cases.cjs'));
        this.useCases = [...UseCasesCommon, ...useCasesApplication];
        console.log(this.useCases);
        this.sqlScriptFunctionality += 'CREATE TABLE functionality."UseCases" (\n';
        this.sqlScriptFunctionality += '    "Id" character varying(255) NOT NULL,\n';
        this.sqlScriptFunctionality += '    "Detail" json NOT NULL';
        this.sqlScriptFunctionality += '\n);\n';
        this.useCases.forEach(useCaseCur => {
            this.sqlScriptFunctionality += ('INSERT INTO functionality."UseCases"("Id", "Detail") VALUES(\'');
            this.sqlScriptFunctionality += (useCaseCur.Name+'\',\'' + jsesc(JSON.stringify(useCaseCur), { 'quotes': 'single' }) + '\');');
        });
        console.log(this.sqlScriptFunctionality);
    }

    createUsers() {
        let users = JSON.parse(fs.readFileSync(this.config.Dir + 'users.cjs'));
        this.users = [...users];
        let entitlements = JSON.parse(fs.readFileSync(this.config.Dir + 'entitlements.cjs'));
        this.entitlements = [...entitlements];
        console.log(this.users);
        console.log(this.sqlScriptAuthorization);
        console.log(this.sqlScriptExecution);
    }

}

module.exports = {
    Application: Application
}
