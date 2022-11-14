
function Nacha(opt) {
    if (!(this instanceof Nacha)) {
        return new Nacha(opt);
    }

    var self = this;

    assert(valid_aba(opt.destinationRouting));

    // number of records including the header and footer must be a multiple of this
    self._blocking_factor = 10;

    self._batches = [];

    var rec = self.header = Record(nachaRecordType["FileHeader"])(); //record.FileHeader();

    rec.immediateDestinationName = opt.destinationName;
    rec.immediateDestination = opt.destinationRouting;
    //rec.immediateOrigin = opt.companyIdentification;
    rec.immediateOrigin = opt.immediateOrigin;
    rec.immediateOriginName = opt.companyName;
    rec.fileCreationDate = opt.fileCreationDate;
    rec.fileCreationTime = opt.fileCreationTime;
    rec.fileId = opt.fileId;
    

    let d = 0;

}

// new batch
Nacha.prototype.batch = function(opt) {
    var self = this;

    var batch = Batch(opt);
    self._batches.push(batch);
    return batch;
};

Nacha.prototype.end = function() {
    var self = this;
    var out = '';

    var records = 0;
    function write(record) {
        out += record.serialize() + '\n';
        
        if (out.length !== 94) {
            let r = 7;
        }
        records++;
    }

    write(self.header);

    // write all batches
    var entryCount = 0;
    var entryHash = 0;
    var debits = 0;
    var credits = 0;
    self._batches.forEach(function(batch, idx) {
        var batchNumber = idx + 1;
        var header = batch.header();
        header.batchNumber = batchNumber;

        write(header);

        batch.entries.forEach(function(entry) {
            entryCount++;
            write(entry);
        });
        var control = batch.control();
        control.batchNumber = batchNumber;

        entryHash += control.entryHash - 0;
//console.log(entryHash)
        credits += parseInt(control.creditAmount);
        
//console.log("\n\n credits:", credits, "  control.creditAmount: ", control.creditAmount);
        
        debits += parseInt(control.debitAmount);
        write(control);
    });

    // make file control record

    var blockCount = Math.ceil(records / self._blocking_factor);

    var control = Record(nachaRecordType["FileControl"])(); // record.FileControl();

    control.batchCount = self._batches.length;
    control.blockCount = blockCount;
    control.entryCount = entryCount;
    control.entryHash = entryHash;
    control.totalDebitAmount = debits;
    control.totalCreditAmount = credits;
    
    if (control.entryHash.length > 10) {
        control.entryHash = control.entryHash.slice(control.entryHash.length-10);
    }

//console.log(control)

    write(control);

    // pad to blocking factor if needed using rows of 9's
    var need_pad = records % self._blocking_factor;
    if (need_pad > 0) {
        need_pad = self._blocking_factor - need_pad;
    }

    for (var i=0 ; i<need_pad ; ++i) {
        out += Array(95).join('9') + '\n';
        records++;
    }

    assert(records % self._blocking_factor === 0);
    return out;
};

var Batch = function(details) {
    if (!(this instanceof Batch)) {
        return new Batch(details);
    }

    var self = this;

    self.details = details;
    self.entries = [];

    self._entry_hash = 0;
    self._debit = 0;
    self._credit = 0;
};

// add an entry to the batch
Batch.prototype.entry = function(opt) {
    var self = this;

    var routing = opt.routing;
    var transit = routing.slice(0, 8);
    var check = routing[8];

    if (!check) {
        throw new Error('no check digit ' + JSON.stringify(opt));
    }

    assert(valid_aba(routing), JSON.stringify(opt));

    // offset for cents and truncate any leftover
    var amount = Number(opt.amount * 100).toFixed(0);

    // check for amount field overflow
    assert(amount <= 9999999999, 'amount is too large');

    var rec = Record(nachaRecordType["EntryDetail"])(); //record.EntryDetail();

    // transaction code is whatever you are doing to the beneficiaries account

    rec.transactionCode = '22';
    
    if (    (opt.account === '1601715'  && opt.routing === '021201383')
        ||  (opt.account === '6100077796' && opt.routing === '211075086')
        ||  (opt.account === '1044833' && opt.routing === '075905033')
        ||  (opt.account === '4039532451' && opt.routing === '122106015')
        ||  (opt.account === '151706186773' && opt.routing === '122105155')
        ||  (opt.account === '0350271007' && opt.routing === '302170463')
        ||  (opt.account === '3450756753' && opt.routing === '021200957')
        ||  (opt.account === '5797827598' && opt.routing === '102003154')
        ||  (opt.account === '4200018798' && opt.routing === '114021933')
        ||  (opt.account === '9361109499' && opt.routing === '122106015')
        ||  (opt.account === '4039532451' && opt.routing === '122106015')
        ||  (opt.account === '000003882990667' && opt.routing === '021000021')
        ||  (opt.account === '6033844176' && opt.routing === '125008547')
        ||  (opt.account === '256040791' && opt.routing === '121100782')
        
        ) {
        rec.transactionCode = '32';
    }
    
    let traceBase = 0;
    if (opt.traceTop8 != null) {
        traceBase = opt.traceTop8 * 10000000;
    }
        
    rec.receivingDFIIdentification = transit;
    rec.checkDigit = check;
    rec.receivingDFIAccountNumber = opt.account;
    rec.amount = amount.toString();
    rec.individualIdentificationNumber = opt.individualId;
    rec.individualName = opt.individualName;
    
    //rec.traceNumber = self.entries.length + 1;
    rec.traceNumber = traceBase + self.entries.length + 1;

    self.entries.push(rec);

    self._entry_hash += (transit - 0);
    

    // TODO track debits and credits
    self._credit += (amount.toString() - 0);
};

Batch.prototype.header = function() {
    var self = this;
    var rec = Record(nachaRecordType["BatchHeader"])(); //record.BatchHeader();

    var opt = this.details;

    rec.serviceClassCode = 220;
    rec.companyName = opt.companyName;
    // fein
    rec.companyIdentification = opt.companyIdentification;
    rec.standardEntryClassCode = 'PPD';
    rec.companyEntryDescription = opt.companyEntryDescription;
    rec.effectiveEntryDate = opt.effectiveEntryDate;
    // our routing
    rec.originatingFinancialInstitution = opt.originatingFIIdentification;
    rec.batchNumber = 0;

    return rec;
};

// get the control record for the batch
Batch.prototype.control = function() {
    var self = this;

    var rec = Record(nachaRecordType["BatchControl"])(); //record.BatchControl();

    var opt = this.details;

    rec.serviceClassCode = '220';
    rec.entryCount = self.entries.length;
    rec.entryHash = self._entry_hash;
    //console.log(rec.entryHash)
    rec.debitAmount = self._debit;
    rec.creditAmount = self._credit;
    // fein
    rec.companyIdentification = opt.companyIdentification;
    // routing
    rec.originatingDFIIdentification = opt.originatingFIIdentification;

    // rec.batchNumber is set by whomever adds this record to a file
    // Batch only manages information for itself
    return rec;
};

const valid_aba = (routing) => {
    if (routing.length !== 9 || !/\d{9}/.test(routing)) {
        return false;
    }

    var d = routing.split('').map(Number);
    var sum =
        3 * (d[0] + d[3] + d[6]) +
        7 * (d[1] + d[4] + d[7]) +
        1 * (d[2] + d[5] + d[8]);

    return sum % 10 === 0;
}

var Record = function(fields) {

    var Obj = function() {
        if (!(this instanceof Obj)) {
            return new Obj();
        }

        var self = this;

        self.fields = fields.map(Field);
        self.fields.forEach(function(field) {
            Object.defineProperty(self, field.name, {
                get: function() {
                    return field.get();
                },
                set: function(val) {
                    field.set(val);
                }
            });
        });
    };

    Obj.prototype.serialize = function() {
        var self = this;

        var out = '';
        self.fields.forEach(function(field) {
            out += field.serialize();

        });

        if (out.length !== 94) {
            let r = 7;
        }

        //assert.equal(out.length, 94, 'invalid record length');
        return out;
    };

    return Obj;
}

var Field = function(details) {
    if (!(this instanceof Field)) {
        return new Field(details);
    }

    var self = this;
    self.name = details.name;
    self.size = details.size;
    self.val = details.default;

    // regex format check
    if (details.format[0] === '/') {
        self.formatter = new RegExp(details.format.slice(1, -1));
        return;
    }

    var formatter = /.*/;

    switch (details.format) {
    case 'Alpha':
        formatter = /[a-zA-Z0-9]*/;
        break;
    case 'Numeric':
    case 'Amount':
        self._numeric = true;
        formatter = new RegExp('[0-9]{0,' + details.size + '}');
        break;
    default:
        throw new Error('unknown format: ' + details.format);
    }

    self.formatter = formatter;
};

Field.prototype.set = function(val) {
    if (!this.formatter.test(val)) {
        throw new Error('invalid value `' + val + '` for field: `' + this.name + '` expected: ' + this.formatter.toString());
    }

    this.val = '' + val;
};

Field.prototype.get = function(val) {
    return this.val;
};

Field.prototype.serialize = function() {
    var self = this;
    var val = this.val;

    if (val === undefined) {
        throw new Error('undefined value for field: ' + this.name);
    }

    var out = '' + val;

    if (out.length > self.size) {
        let s = 8;
        out = '' + val.substr(0, self.size);
    }
    assert(out.length <= self.size, 'value `' + out + '` is too big for field: ' + this.name);

    var pads = Array(self.size - out.length + 1);

    if (self._numeric) {
        return pads.join('0') + out;
    }

    return out + pads.join(' ');
}

const nachaRecordType =
{
  "FileHeader": [
    {
      "name": "type",
      "size": 1,
      "format": "/1/",
      "default": "1"
    },
    {
      "name": "priorityCode",
      "size": 2,
      "format": "/\\d\\d/",
      "default": "01"
    },
    {
      "name": "_space_",
      "size": 1,
      "format": "/ /",
      "default": " "
    },
    {
      "name": "immediateDestination",
      "size": 9,
      "format": "/\\d{9}/"
    },
    {
      "name": "immediateOrigin",
      "size": 10,
      "format": "Alpha"
    },
    {
      "name": "fileCreationDate",
      "size": 6,
      "format": "/\\d{6}/"
    },
    {
      "name": "fileCreationTime",
      "size": 4,
      "format": "/\\d{4}/",
      "default": ""
    },
    {
      "name": "fileId",
      "size": 1,
      "format": "/[A-Z0-9]/",
      "default": ""
    },
    {
      "name": "recordSize",
      "size": 3,
      "format": "/\\d{3}/",
      "default": "094"
    },
    {
      "name": "blockingFactor",
      "size": 2,
      "format": "/\\d{2}/",
      "default": "10"
    },
    {
      "name": "formatCode",
      "size": 1,
      "format": "/1/",
      "default": "1"
    },
    {
      "name": "immediateDestinationName",
      "size": 23,
      "format": "Alpha",
      "default": ""
    },
    {
      "name": "immediateOriginName",
      "size": 23,
      "format": "Alpha",
      "default": ""
    },
    {
      "name": "referenceCode",
      "size": 8,
      "format": "Alpha",
      "default": ""
    }
  ],
  "BatchHeader": [
    {
      "name": "type",
      "size": 1,
      "format": "/5/",
      "default": "5"
    },
    {
      "name": "serviceClassCode",
      "size": 3,
      "format": "Numeric"
    },
    {
      "name": "companyName",
      "size": 16,
      "format": "Alpha"
    },
    {
      "name": "companyDiscretionaryData",
      "size": 20,
      "format": "Alpha",
      "default": ""
    },
    {
      "name": "companyIdentification",
      "size": 10,
      "format": "Numeric"
    },
    {
      "name": "standardEntryClassCode",
      "size": 3,
      "format": "/PPD|CCD"
    },
    {
      "name": "companyEntryDescription",
      "size": 10,
      "format": "Alpha"
    },
    {
      "name": "companyDescriptiveDate",
      "size": 6,
      "format": "Alpha",
      "default": ""
    },
    {
      "name": "effectiveEntryDate",
      "size": 6,
      "format": "Numeric"
    },
    {
      "name": "settlementDate",
      "size": 3,
      "format": "/[ ]{3}",
      "default": "   "
    },
    {
      "name": "originatorStatusCode",
      "size": 1,
      "format": "Numeric",
      "default": "1"
    },
    {
      "name": "originatingFinancialInstitution",
      "size": 8,
      "format": "Numeric"
    },
    {
      "name": "batchNumber",
      "size": 7,
      "format": "Numeric"
    }
  ],
  "EntryDetail": [
    {
      "name": "type",
      "size": 1,
      "format": "/6/",
      "default": "6"
    },
    {
      "name": "transactionCode",
      "size": 2,
      "format": "Numeric"
    },
    {
      "name": "receivingDFIIdentification",
      "size": 8,
      "format": "Numeric"
    },
    {
      "name": "checkDigit",
      "size": 1,
      "format": "Numeric"
    },
    {
      "name": "receivingDFIAccountNumber",
      "size": 17,
      "format": "Alpha"
    },
    {
      "name": "amount",
      "size": 10,
      "format": "Numeric"
    },
    {
      "name": "individualIdentificationNumber",
      "size": 15,
      "format": "Alpha"
    },
    {
      "name": "individualName",
      "size": 22,
      "format": "Alpha"
    },
    {
      "name": "discretionaryData",
      "size": 2,
      "format": "Alpha",
      "default": "  "
    },
    {
      "name": "addendaRecordIdentifier",
      "size": 1,
      "format": "/1|0/",
      "default": "0"
    },
    {
      "name": "traceNumber",
      "size": 15,
      "format": "Numeric"
    }
  ],
  "BatchControl": [
    {
      "name": "type",
      "size": 1,
      "format": "/8/",
      "default": "8"
    },
    {
      "name": "serviceClassCode",
      "size": 3,
      "format": "Numeric"
    },
    {
      "name": "entryCount",
      "size": 6,
      "format": "Numeric"
    },
    {
      "name": "entryHash",
      "size": 10,
      "format": "Numeric"
    },
    {
      "name": "debitAmount",
      "size": 12,
      "format": "Numeric"
    },
    {
      "name": "creditAmount",
      "size": 12,
      "format": "Numeric"
    },
    {
      "name": "companyIdentification",
      "size": 10,
      "format": "Numeric"
    },
    {
      "name": "messageAuthenticationCode",
      "size": 19,
      "format": "Alpha",
      "default": ""
    },
    {
      "name": "reserved",
      "size": 6,
      "format": "/[ ]{6}",
      "default": ""
    },
    {
      "name": "originatingDFIIdentification",
      "size": 8,
      "format": "Numeric"
    },
    {
      "name": "batchNumber",
      "size": 7,
      "format": "Numeric"
    }
  ],
  "FileControl": [
    {
      "name": "type",
      "size": 1,
      "format": "/9/",
      "default": "9"
    },
    {
      "name": "batchCount",
      "size": 6,
      "format": "Numeric"
    },
    {
      "name": "blockCount",
      "size": 6,
      "format": "Numeric"
    },
    {
      "name": "entryCount",
      "size": 8,
      "format": "Numeric"
    },
    {
      "name": "entryHash",
      "size": 10,
      "format": "Numeric"
    },
    {
      "name": "totalDebitAmount",
      "size": 12,
      "format": "Amount"
    },
    {
      "name": "totalCreditAmount",
      "size": 12,
      "format": "Amount"
    },
    {
      "name": "reserved",
      "size": 39,
      "format": "/[ ]{39}/",
      "default": ""
    }
  ]
};

module.exports = {
    Nacha: Nacha
}