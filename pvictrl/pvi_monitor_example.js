#!/usr/bin/env node

const exec = require('child_process').exec;
const { ServerMonitor } = require('plainvanillainfo/pvimon');

let processName = 'pvi_monitor_example';
let cmd = 'ps -A ';

exec(cmd, (err, stdout, stderr) => {
    if (stdout.indexOf(processName) > -1) {
        let serverConfig = {
            HeartbeatIntervalInMS: 10000
        };
        let serverMonitor = new ServerMonitor(serverConfig);
        setTimeout(() => { serverMonitor.start({}); }, 10);    
    }
});
