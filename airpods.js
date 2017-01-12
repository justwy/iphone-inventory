const INV_URL_PATTERN = 'http://www.apple.com/shop/retail/pickup-message?parts.0=MMEF2AM%2FA&location=%s';

var request = require('request');
var lodash = require('lodash');
var util = require('util');
var exec = require('child_process').exec;

var lastStores = '';
var repeatCount = 0;


const AIRPODS_PROD_CODE = "MMEF2AM/A";
const REPEAT_NOTIFICATION = 5;


function checkInv(cb) {
    return queryStores('11373', cb);
}

function queryStores(zipcode, cb) {
    request(util.format(INV_URL_PATTERN, zipcode), function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var storeArray = JSON.parse(body).body.stores;

            storeArray = lodash.filter(storeArray, function(store) {
                return "ships-to-store" !== store.partsAvailability[AIRPODS_PROD_CODE].pickupDisplay
            });

            return cb(null, storeArray)
        }
    });
}

setInterval(checkInv, 10000, function(err, storesWithInv) {
    if (storesWithInv.length > 0) {
        console.log('http://www.apple.com/shop/product/MMEF2AM/A/airpods');
        var stores = lodash.map(storesWithInv, function(each) {
            return each.storeName;
        }).join(', ');

        if (stores === lastStores) {
            repeatCount++;
            console.log('repeat ' + repeatCount + ' times.');
            if (repeatCount >= REPEAT_NOTIFICATION) {
                console.log('repeat more than 10 times. no notification.')
                return;
            }
        } else {
            console.log(util.format('new store found [%s]', stores));
            repeatCount = 0;
            lastStores = stores;
        }

        var notificationCmd = 'osascript -e \'display notification "%s" sound name "Ping" with title "Airpods"\''
        exec(util.format(notificationCmd, stores));
    } else {
        console.log('tried on ' + new Date());
    }
})
