const functions = require('firebase-functions');
const admin = require('firebase-admin');
var serviceAccount = require('./atnt-channel-recorder-firebase-adminsdk-jv1s9-dbe961ed32.json');
const express = require('express');
const CHANNEL_1_COLLECTION = 'channel_1';
const CHANNEL_2_COLLECTION = 'channel_2';
const CHANNEL_3_COLLECTION = 'channel_3';
const USER_COLLECTION = 'user';
const USER_ONLY_ID = 'only_user';
const fs = require('fs');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://atnt-channel-recorder.firebaseio.com"
});
var db = admin.firestore();


//create document in firestore (DEBUG PURPOSES ONLY)
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


//Updates the entire database with up to date data
const appUpdateShow = express();
appUpdateShow.get('', (req, res) => {

    var channel_1_Ref = db.collection(CHANNEL_1_COLLECTION);
    var channel_2_Ref = db.collection(CHANNEL_2_COLLECTION);
    var channel_3_Ref = db.collection(CHANNEL_3_COLLECTION);
    var userRef = db.collection(USER_COLLECTION).doc(USER_ONLY_ID);

    var currentMillis = (new Date).getTime();

    var channel_1_json = JSON.parse(fs.readFileSync('./database/Channel_1.json'));
    var channel_2_json = JSON.parse(fs.readFileSync('./database/Channel_2.json'));
    var channel_3_json = JSON.parse(fs.readFileSync('./database/Channel_3.json'));
    
    var batch = db.batch();

    //Remove user's current recording too
    batch.update(userRef, {currentRecording: null});

    var milliSecondOffSet = Math.floor(currentMillis/1000);

    for (var i = 0; i < channel_1_json.length; i++) {
        channel_1_json[i].startTime = milliSecondOffSet;
        milliSecondOffSet += (channel_1_json[i].duration);
        batch.set(channel_1_Ref.doc('' + channel_1_json[i].id), channel_1_json[i]);
    }
    for (var i = 0; i < channel_2_json.length; i++) {
        channel_2_json[i].startTime = milliSecondOffSet;
        milliSecondOffSet += (channel_2_json[i].duration);
        batch.set(channel_2_Ref.doc('' + channel_2_json[i].id), channel_2_json[i]);
    }
    for (var i = 0; i < channel_3_json.length; i++) {
        channel_3_json[i].startTime = milliSecondOffSet;
        milliSecondOffSet += (channel_3_json[i].duration );
        batch.set(channel_3_Ref.doc('' + channel_3_json[i].id), channel_3_json[i]);
    }

    return batch.commit().then(result => {
        return res.send('OK');
    }).catch(error => {
        return res.status(500).send(error);
    });
});
exports.getUpdatedShows = functions.https.onRequest(appUpdateShow);

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
exports.programs = functions.https.onRequest(appGetChannels);


const appBookRecording = express();
appBookRecording.post('', (req, res) => {
    var channelNumber = req.query.channel_number;
    var programId = req.query.program_id;
    
    var channelCollection = "channel_" + channelNumber;
    
    //First get the program document
    var programRef = db.collection(channelCollection).doc(programId);
    var userRef = db.collection(USER_COLLECTION).doc(USER_ONLY_ID);
    return programRef.get()
        //Check then insert doc into user
        .then(doc => {
            return userRef.update({'currentRecording' : doc.data()});
        })
        .catch(err => {
            return res.status(500).send(err);
        })
        .then(result => {
            return res.status(200).send("OK");
        })
        .catch(err => {
            return res.status(500).send(err);
        });
});

appBookRecording.delete('', (req, res) => {
    var programId = req.query.program_id;
    var userRef = db.collection(USER_COLLECTION).doc(USER_ONLY_ID);
    return userRef.update({'currentRecording' : null})
        .then(result => {
            return res.status(200).send('OK');
        }).catch(err => {
            return res.status(500).send(err);
        });
});

exports.recording = functions.https.onRequest(appBookRecording);