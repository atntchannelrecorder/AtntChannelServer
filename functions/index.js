const functions = require('firebase-functions');
const admin = require('firebase-admin');
var serviceAccount = require('./atnt-channel-recorder-firebase-adminsdk-jv1s9-dbe961ed32.json');
const express = require('express');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://atnt-channel-recorder.firebaseio.com"
});
var db = admin.firestore();


//create document in firestore
const appPostShow = express();
appPostShow.post('', (req, res) => {
    var channelNumber = req.query.channel_number;
    var channelCol = 'channel_' + channelNumber;

    var batch = db.batch();
    for(var i in req.body) {
        var docId = req.body[i].id.toString();
        var docRef = db.collection(channelCol).doc(docId);
        batch.set(docRef, req.body[i]);
    }
    return batch.commit().then(result => {
        return res.send(req.body);
    }).catch(error => {
        return res.status(500).send(error);
    });
});  
exports.postShow = functions.https.onRequest(appPostShow);


const appGetChannels = express();
appGetChannels.get('', (req, res) => {
    var channelNumber = req.query.channel_number;
    var channelCol = 'channel_' + channelNumber;
    
    var first = db.collection(channelCol).limit(10);
    return first.get().then((snapshot) => {
        var result = [];
        snapshot.forEach(doc => {
            result.push(doc.data());
        });
        return res.send(result);
    }).catch(error => {
        return res.status(500).send(error);
    });
    
});
exports.getChannels = functions.https.onRequest(appGetChannels);