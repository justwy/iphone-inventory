const INV_URL = 'https://reserve.cdn-apple.com/US/en_US/reserve/iPhone/availability.json';

const STORE_URL = 'https://reserve.cdn-apple.com/US/en_US/reserve/iPhone/stores.json';

const DESIRED_MODELS = [
    'MN5T2LL/A',  // verizon 7p 128G black
    'MN5Y2LL/A', // verizon 7p 256G black
    'MN5X2LL/A', // verizon 7p 128G jet black
    'MN632LL/A', // verizon 7p 256G jet black
];

var request = require('request');
var lodash = require('lodash');
var exec = require('child_process').exec;

function checkInv(cb) {
    var availability = [];
    queryStores(['New York'], ['New York', 'Elmhurst'], function(err, storeByCode) {

        request(INV_URL, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var inventoryByStore = JSON.parse(body);

                lodash.forEach(inventoryByStore, function(storeInvs, storeCode) {
                    DESIRED_MODELS.forEach(function(model) {
                        if (storeInvs[model] && storeInvs[model] !== 'NONE') {
                            var store = storeByCode[storeCode];
                            if (store) {
                                availability.push({
                                    storeName: store.storeName,
                                    model: model
                                })
                            }
                        }
                    })
                });

                return cb(null, availability);
            }
        })
    });
}

function queryStores(storeStates, storeCities, cb) {
    request(STORE_URL, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var storeArray = JSON.parse(body).stores;
            storeArray = lodash.filter(storeArray, function(store) {
                return storeStates.indexOf(store.storeState) !== -1;
            })

            storeArray = lodash.filter(storeArray, function(store) {
                return storeCities.indexOf(store.storeCity) !== -1;
            })

            // convert from array to map keyed by store code

            var storeByCode = {};
            lodash.forEach(storeArray, function(store) {
                storeByCode[store.storeNumber] = store;
            })

            return cb(null, storeByCode)
        }
    });
}

setInterval(checkInv, 10000, function(err, availability) {
    if (availability.length > 0) {
        console.log(availability);
        console.log('https://reserve.cdn-apple.com/US/en_US/reserve/iPhone/availability?channel=1&sourceID=email&rv=0&path=&iPP=U&appleCare=Y');
        exec('say Pay attention. Found iPhone. Found iPhone. Found iPhone. Found iPhone.');
    } else {
        console.log('tried on ' + new Date());
    }
})
