
const { ClassesCommon, UseCasesCommon } = require('plainvanillainfo/pvimeta');
const fs = require('fs');
const { default: e } = require('express');

class Application {
    constructor(config) {
        this.config = config;
        this.classes = [];
        this.classesAll = [];
        this.sqlScriptTables = 'CREATE SCHEMA data;\n';
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
        console.log(this.sqlScriptTables);
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
        this.classes.push(classInfo);
        if (baseClassInfo == null) {
            classInfo.tableName = classInfo.Name;
            this.sqlScriptTables += 'CREATE TABLE data."' + classInfo.Name + '" (\n';
            this.sqlScriptTables += '    "Id" uuid NOT NULL,\n';
        } else {
            classInfo.tableName = baseClassInfo.tableName;
        }
        classInfo.Components.forEach(componentCur => {
            if (componentCur.Type != null) {
                this.sqlScriptTables += '    "' + componentCur.Name + '" ';
                switch (componentCur.Type.toLowerCase()) {
                    case 'varchar':
                        this.sqlScriptTables += 'character varying';
                        if (componentCur.Length != null) {
                            this.sqlScriptTables += ('(' + componentCur.Length + ')');
                        }
                        break;
                    case 'text':
                        this.sqlScriptTables += 'text';
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
        classInfo.References.forEach(referenceCur => {
            this.sqlScriptTables += '    "' + referenceCur.Name + '" ';
            this.sqlScriptTables += 'uuid not null ,\n';
        });
        classInfo.Extensions.forEach(extensionCur => {
            this.createTable(extensionCur, classInfo);
        });
        if (baseClassInfo == null) {
            this.sqlScriptTables = this.sqlScriptTables.slice(0, -2) + '\n);\n';
        }
    }

    createTablePrimaryKey(classInfo) {
		this.sqlScriptTables += 'ALTER TABLE ONLY data."' + classInfo.Name + 
			'" \n    ADD CONSTRAINT "' + classInfo.Name + '_pkey" PRIMARY KEY ("Id");\n';
	}

    createLinkTables(classInfo) {
        classInfo.Children.forEach((childCur, indexIndex) => {
			let childTableName = classInfo.Name + '_CHILD_' + childCur.Name;
			this.sqlScriptTables += ('CREATE TABLE data."' + childTableName + '" (\n');
			this.sqlScriptTables += '    "ParentId" uuid NOT NULL,\n';
			this.sqlScriptTables += '    "ChildId" uuid NOT NULL\n);\n';

			this.sqlScriptTables += ('ALTER TABLE ONLY data."' + childTableName + '"\n');
			this.sqlScriptTables += ('    ADD CONSTRAINT "' + childCur.Name + '_pkey" ');
			this.sqlScriptTables += ('PRIMARY KEY ("ParentId", "ChildId") ;\n');

			this.sqlScriptTables += ('ALTER TABLE ONLY data."' + childTableName + '"\n');
			this.sqlScriptTables += ('    ADD CONSTRAINT "' + childCur.Name + '_REFERENCE" ');
			this.sqlScriptTables += ('FOREIGN KEY ("ChildId") REFERENCES data."' + childCur.ClassName + '"("Id") NOT VALID;\n');
		});
		classInfo.Extensions.forEach((extensionCur, extensionIndex) => {
			this.createLinkTables(extensionCur);
		});
	}

    createTableForeignKeys(classInfo) {
        classInfo.References.forEach((referenceCur, referenceIndex) => {
            let referedClass = this.classesAll.find(cur => cur.Name === referenceCur.ReferedClass);
			this.sqlScriptTables += ('ALTER TABLE ONLY data."' + classInfo.tableName + '"\n');
			this.sqlScriptTables += ('    ADD CONSTRAINT "' + referenceCur.Name + '_REFERENCE" ');
			this.sqlScriptTables += ('FOREIGN KEY ("' + referenceCur.Name + '") REFERENCES data."' + referedClass.tableName + '"("Id") NOT VALID;\n');
        });
		classInfo.Extensions.forEach((extensionCur, extensionIndex) => {
			this.createTableForeignKeys(extensionCur);
		});
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
