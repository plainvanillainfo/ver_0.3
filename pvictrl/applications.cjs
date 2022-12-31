
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
        this.sqlScriptAuthorization = 'CREATE SCHEMA IF NOT EXISTS authorizations;\n';
        this.sqlScriptExecution = 'CREATE SCHEMA IF NOT EXISTS execution;\n';
    }

    createClasses() {
        let classesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'classes.cjs'));
        this.classes = [...ClassesCommon, ...classesApplication];
        this.classes.forEach((classCur) => {
            this.deepen(classCur);
        });
        console.log(this.classes, "\n");
        let flatAdditions = [];
        this.classes.forEach(classCur => {
    	    let additions = this.flatten(classCur);
            additions.forEach(cur => {
                flatAdditions.push(cur);
            });
        });
        flatAdditions.forEach(cur => {
            this.classes.push(cur);
        });
        this.classes.forEach(classCur => {
            if (classCur.Base == null || classCur.Base === '') {
			    this.createTable(classCur, null);
            }
        });
        this.classes.forEach(classCur => {
            //console.log("DDDD: ", classCur.Name);
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
        let classRoot = this.classes.find(cur => cur.Name === 'Root');
        if (classRoot != null) {
            this.sqlScriptData += ('INSERT INTO data."Root"("Id", "Extension", "Name") VALUES(\'');
            this.sqlScriptData += ('11111111-1111-1111-1111-111111111111\',\'[]\',\'Root\');\n');
            
        }
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
    
    flatten(classInfo) {
        let retVal = [];
		classInfo.Extensions.forEach(extensionCur => {
            let classFound = this.classes.find(cur => cur.Name === extensionCur.Name);
            if (classFound == null) {
                extensionCur.Base = classInfo.Name;
                retVal.push(extensionCur);
            }
			let additions = this.flatten(extensionCur);
            additions.forEach(cur => {
                retVal.push(cur);
            });
		});
        return retVal;
    }

    createTable(classInfo, baseClassInfo) {
        this.classesAll.push(classInfo);
        //classInfo.extensionTree = {};
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
            } else {
                if (componentCur.EmbeddedClass != null) {
                    this.sqlScriptData += '    "' + componentCur.Name + '" ';
                    this.sqlScriptData += 'uuid not null ,\n';
                }
            }
        });
        classInfo.References.forEach(referenceCur => {
            this.sqlScriptData += '    "' + referenceCur.Name + '" ';
            this.sqlScriptData += 'uuid not null ,\n';
        });
        classInfo.Extensions.forEach(extensionCur => {
            this.createTable(extensionCur, classInfo);
        });
        if (baseClassInfo == null) {
            this.sqlScriptData = this.sqlScriptData.slice(0, -2) + '\n);\n';
            this.sqlScriptData += ('COMMENT ON TABLE data."' + classInfo.Name + '" IS \'' + JSON.stringify({ExtensionTree: classInfo}) + '\';\n\n');
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
			this.sqlScriptData += ('    ADD CONSTRAINT "' + childTableName + '_pkey" ');
			this.sqlScriptData += ('PRIMARY KEY ("ParentId", "ChildId") ;\n');

			this.sqlScriptData += ('ALTER TABLE ONLY data."' + childTableName + '"\n');
			this.sqlScriptData += ('    ADD CONSTRAINT "' + childTableName + '_' + classInfo.Name + '_REFERENCE" ');
			this.sqlScriptData += ('FOREIGN KEY ("ParentId") REFERENCES data."' + classInfo.tableName + '"("Id") NOT VALID;\n');

			this.sqlScriptData += ('ALTER TABLE ONLY data."' + childTableName + '"\n');
			this.sqlScriptData += ('    ADD CONSTRAINT "' + childTableName + '_' + childCur.Name + '_REFERENCE" ');
			this.sqlScriptData += ('FOREIGN KEY ("ChildId") REFERENCES data."' + childClass.tableName + '"("Id") NOT VALID;\n');
		});
		classInfo.Extensions.forEach(extensionCur => {
			this.createLinkTables(extensionCur);
		});
	}

    createTableForeignKeys(classInfo) {
        classInfo.References.forEach(referenceCur => {
            let referredClass = this.classesAll.find(cur => cur.Name === referenceCur.ReferredClass);
			this.sqlScriptData += ('ALTER TABLE ONLY data."' + classInfo.tableName + '"\n');
			this.sqlScriptData += ('    ADD CONSTRAINT "' + referenceCur.Name + '_REFERENCE" ');
			this.sqlScriptData += ('FOREIGN KEY ("' + referenceCur.Name + '") REFERENCES data."' + referredClass.tableName + '"("Id") NOT VALID;\n');
        });
        classInfo.Components.forEach(componentCur => {
            if (componentCur.EmbeddedClass != null) {
                let embeddedClass = this.classesAll.find(cur => cur.Name === componentCur.EmbeddedClass);
                this.sqlScriptData += ('ALTER TABLE ONLY data."' + classInfo.tableName + '"\n');
                this.sqlScriptData += ('    ADD CONSTRAINT "' + componentCur.Name + '_EMBED" ');
                this.sqlScriptData += ('FOREIGN KEY ("' + componentCur.Name + '") REFERENCES data."' + embeddedClass.tableName + '"("Id") NOT VALID;\n');
            }
        });
		classInfo.Extensions.forEach(extensionCur => {
			this.createTableForeignKeys(extensionCur);
		});
    }

    createUseCases() {
        let configApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'app_config.cjs'));
        this.sqlScriptFunctionality += 'CREATE TABLE functionality."AppConfig" (\n';
        this.sqlScriptFunctionality += '    "Param" character varying(255) NOT NULL,\n';
        this.sqlScriptFunctionality += '    "Value" json NOT NULL';
        this.sqlScriptFunctionality += '\n);\n';
        for (let paramCur in configApplication) {
            let paramValue = configApplication[paramCur];
            this.sqlScriptFunctionality += ('INSERT INTO functionality."AppConfig"("Param", "Value") VALUES(\'');
            this.sqlScriptFunctionality += (paramCur+'\',\'' + jsesc(JSON.stringify(paramValue), { 'quotes': 'single' }) + '\');\n');
        }
        this.sqlScriptFunctionality += ('INSERT INTO functionality."AppConfig"("Param", "Value") VALUES(\'');
        this.sqlScriptFunctionality += ('Classes\',\'' + jsesc(JSON.stringify(this.classes), { 'quotes': 'single' }) + '\');\n');

        let useCasesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'use_cases.cjs'));
        this.useCases = [...UseCasesCommon, ...useCasesApplication];
        this.sqlScriptFunctionality += 'CREATE TABLE functionality."UseCases" (\n';
        this.sqlScriptFunctionality += '    "Id" character varying(255) NOT NULL,\n';
        this.sqlScriptFunctionality += '    "Detail" json NOT NULL';
        this.sqlScriptFunctionality += '\n);\n';
        this.useCases.forEach(useCaseCur => {
            this.sqlScriptFunctionality += ('INSERT INTO functionality."UseCases"("Id", "Detail") VALUES(\'');
            this.sqlScriptFunctionality += (useCaseCur.Name+'\',\'' + jsesc(JSON.stringify(useCaseCur), { 'quotes': 'single' }) + '\');\n');
        });
        console.log(this.sqlScriptFunctionality);
    }

    createUsers() {
        let users = JSON.parse(fs.readFileSync(this.config.Dir + 'users.cjs'));
        this.users = [...users];
        this.sqlScriptAuthorization += 'CREATE TABLE authorizations."Users" (\n';
        this.sqlScriptAuthorization += '    "Id" character varying(255) NOT NULL,\n';
        this.sqlScriptAuthorization += '    "Name" character varying(255) NOT NULL,\n';
        this.sqlScriptAuthorization += '    "Active" boolean NOT NULL';
        this.sqlScriptAuthorization += '\n);\n';
        this.users.forEach(userCur => {
            this.sqlScriptAuthorization += ('INSERT INTO authorizations."Users"("Id", "Name", "Active") VALUES(\'');
            this.sqlScriptAuthorization += (userCur.Id+'\',\'' + userCur.Name+'\',\'' + userCur.Active + '\');\n');
        });

        let entitlements = JSON.parse(fs.readFileSync(this.config.Dir + 'entitlements.cjs'));
        this.entitlements = [...entitlements];
        this.sqlScriptAuthorization += 'CREATE TABLE authorizations."Entitlements" (\n';
        this.sqlScriptAuthorization += '    "Id" character varying(255) NOT NULL,\n';
        this.sqlScriptAuthorization += '    "UseCase" character varying(255) NOT NULL,\n';
        this.sqlScriptAuthorization += '    "BaseObject" character varying(255) NOT NULL,\n';
        this.sqlScriptAuthorization += '    "UserId" character varying(255) NOT NULL';
        this.sqlScriptAuthorization += '\n);\n';
        this.entitlements.forEach(entitlementCur => {
            this.sqlScriptAuthorization += ('INSERT INTO authorizations."Entitlements"("Id", "UseCase", "BaseObject", "UserId") VALUES(\'');
            this.sqlScriptAuthorization += (entitlementCur.Id+'\',\'' + entitlementCur.UseCase+'\',\'' + entitlementCur.BaseObject+'\',\'' + entitlementCur.UserId + '\');\n');
        });
        console.log(this.sqlScriptAuthorization);
        console.log(this.sqlScriptExecution);
    }

}

module.exports = {
    Application: Application
}
