
const { ClassesCommon, UseCasesCommon } = require('plainvanillainfo/pvimeta');
const fs = require('fs');

class Application {
    constructor(config) {
        this.config = config;
        this.sqlScriptTables = 'CREATE SCHEMA data;\n';
    }

    createClasses() {
        let classesApplication = JSON.parse(fs.readFileSync(this.config.Dir + 'classes.cjs'));
        let classes = [...ClassesCommon, ...classesApplication];
        console.log(classes);
        classes.forEach(classCur => {
			this.createTable(classCur);
        });
        classes.forEach(classCur => {
			this.createTablePrimaryKey(classCur);
        });
        classes.forEach(classCur => {
			this.createLinkTables(classCur);
        });
        classes.forEach(classCur => {
			this.createTableForeignKeys(classCur);
        });
        console.log(this.sqlScriptTables);
    }
    
    createTable(classInfo) {
		if (classInfo.Base != null && classInfo.Base > '') {
		} else {
			this.sqlScriptTables += 'CREATE TABLE data."' + classInfo.Name + '" (\n';
			this.sqlScriptTables += '    "Id" uuid NOT NULL,\n';
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
			classInfo.References.forEach((referenceCur, referenceIndex) => {
				this.sqlScriptTables += '    "' + referenceCur.Name + '" ';
				this.sqlScriptTables += 'uuid not null ,\n';
			});
			this.sqlScriptTables = this.sqlScriptTables.slice(0, -2) + '\n);\n';
			classInfo.Extensions.forEach((extensionCur, extensionIndex) => {
				this.createTable(extensionCur);
			});
		}
	}

    createTablePrimaryKey(classInfo) {
		this.sqlScriptTables += 'ALTER TABLE ONLY data."' + classInfo.Name + 
			'" \nADD CONSTRAINT "' + classInfo.Name + '_pkey" PRIMARY KEY ("Id");\n';
		classInfo.Extensions.forEach((extensionCur, extensionIndex) => {
			this.createTablePrimaryKey(extensionCur);
		});
	}

    createLinkTables(classInfo) {
        classInfo.Children.forEach((childCur, indexIndex) => {
			/*
			ALTER TABLE ONLY public."CommunityContractAttachment"
    		ADD CONSTRAINT "AttachmentIdReference" FOREIGN KEY ("AttachmentId") REFERENCES public."CoreAttachment"("UUID") NOT VALID;
			*/
			let childTableName = classInfo.Name + '_CHILD_' + childCur.Name;
			this.sqlScriptTables += ('CREATE TABLE data."' + childTableName + '" (\n');
			this.sqlScriptTables += '    "ParentId" uuid NOT NULL,\n';
			this.sqlScriptTables += '    "ChildId" uuid NOT NULL\n);\n';

			this.sqlScriptTables += ('ALTER TABLE ONLY data."' + childTableName + '"\n');
			this.sqlScriptTables += ('    ADD CONSTRAINT "' + childCur.Name + '_pkey" ');
			this.sqlScriptTables += ('PRIMARY KEY ("ParentId", "ChildId") ;\n');

			this.sqlScriptTables += ('ALTER TABLE ONLY data."' + childTableName + '"\n');
			this.sqlScriptTables += ('    ADD CONSTRAINT "' + childCur.Name + '_REFERENCE" ');
			this.sqlScriptTables += ('FOREIGN KEY ("ChildId") REFERENCES data."' + childCur.Name + '"("Id") NOT VALID;\n');
		});
		classInfo.Extensions.forEach((extensionCur, extensionIndex) => {
			this.createLinkTables(extensionCur);
		});
	}

    createTableForeignKeys(classInfo) {
        classInfo.References.forEach((referenceCur, referenceIndex) => {
            
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
