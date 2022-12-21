const fs = require("fs");
const parse = require('csv-parse')
const jsesc = require("jsesc");
const jsesc = require("jsesc");
const uuidv4 = require("uuid").v4;


const readBKR_REP = () => {
    fs.readFile('/home/ubuntu/junk/IHCAdvisors121922.csv', function (err, fileData) {
        parse(fileData, {columns: true, trim: true, delimiter: ',' }, function(err, rows) {
            if (err) {
                console.log("Err: ", err);
            }
            rows.forEach((rowCur, index) => {

                if (ihcBrokers.find(cur => cur.RepNum === rowCur["Advisor Id"].toString()) == null) {
                    
                    let brokerCur = {
                        RepNum: rowCur["Advisor Id"].toString(),
                        OffNum: rowCur["Office #"].toString(),
                        RepName1: rowCur["Name"].toString(),
                        RepName2: rowCur["Rep 2 Name"].toString(),
                        Address1: rowCur["Address 1"].toString(),
                        Address2: rowCur["Address 2"].toString(),
                        City: rowCur["City"].toString(),
                        State: rowCur["State"].toString(),
                        Zip: rowCur["Zip"].toString(),
                        CityStateZip: rowCur["City State, and Zip"].toString(),
                        PhoneNum: rowCur["Phone"].toString(),
                        Email: rowCur["Email"].toString(),
                        BrokerId: rowCur["BD #"].toString(),
                        BkrDlrName: rowCur["Broker Dealer Name"].toString(),
                        Subscriptions: []
                    };
                    ihcBrokers.push(brokerCur);
                    
                }
            
            });

            readOWNERSHIP_TYPE();
        })
    })
}
