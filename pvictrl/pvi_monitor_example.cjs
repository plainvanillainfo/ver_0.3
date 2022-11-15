#!/usr/bin/env node

//
// This script is called by cron at specified times to make sure that a PVI Server is being monitored.
//
// If the script is already running, then it exists wih no further action. Otherwise, an instance of the ServerMonitor
// class is created and started. 
//
// The ServerMonitor object runs a forever loop that monitors the server per config information given to it.
//

const exec = require('child_process').exec;
const { ServerMonitor } = require('plainvanillainfo/pvimon');

let processName = 'pvi_monitor_example';
let cmd = 'ps -Af ';

exec(cmd, (err, stdout, stderr) => {
    if (stdout.indexOf(processName) > -1) {
        let serverConfig = {
            HeartbeatIntervalInMS: 10000,
            Jobs: [
                "AppLifeCycle"
            ]
        };
        let serverMonitor = new ServerMonitor(serverConfig);
        setTimeout(() => { serverMonitor.start({}); }, 10);    
    }
});
