const functions = require('firebase-functions');

const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const calendar = google.calendar('v3');
const mail = google.gmail('v1');


const googleCredentials = require('./credentials.json');

const ERROR_RESPONSE_CALENDAR = {
    status: '500',
    message: 'There was an error addding an event to your calendar'
}


const ERROR_RESPONSE_MAIL = {
    status: '500',
    message: 'There was an error sending a mail to your mail-address'
}

const TIME_ZONE = 'Asia/Seoul'

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions


exports.sendEmail = functions.https.onRequest((req, res)=>{
    const { userName, email, phone, message } = req.body;

    let content = userName + '\n' + email + '\n' + phone + '\n' + message;
    
    const oAuth2Clint = new OAuth2(
        googleCredentials.web.client_id,
        googleCredentials.web.client_secret,
        googleCredentials.web.redirect_uris[0]
    );

    oAuth2Clint.setCredentials({
        refresh_token: googleCredentials.refresh_token_mail
    });

    sendEmail(oAuth2Clint, 'ugmun@deepbio.co.kr', content).then(
        data => {
            res.status(200).json(data);
            return;
        }
    ).catch( err=>{
        console.error('Error adding event' + err);
        res.status(500).send(ERROR_RESPONSE_MAIL);
        return;
    });
});


exports.addEventToCalendar = functions.https.onRequest((req, res)=>{
    console.log(req.body);
    const eventData = {
        eventName : req.body.eventName,
        description : req.body.description,
        startTime: req.body.startTime +':00',
        endTime: req.body.endTime +':00',
    }
    const oAuth2Clint = new OAuth2(
        googleCredentials.web.client_id,
        googleCredentials.web.client_secret,
        googleCredentials.web.redirect_uris[0]
    );

    oAuth2Clint.setCredentials({
        refresh_token : googleCredentials.refresh_token_calendar
    });

    addEvent(eventData, oAuth2Clint ).then(data => {
        res.status(200).redirect('https://uigeomun.github.io/agency-jekyll-theme/#event_add');
        return;
    }).catch( err =>{
        console.error('Error adding event: '+ err);
        res.status(500).send(ERROR_RESPONSE_CALENDAR);
        return;
        }
    );
});

function addEvent(event, auth){
    return new Promise( (resolve, reject)=>{
        calendar.events.insert({
            auth: auth,
            calendarId: 'ugmun@deepbio.co.kr',
            resource: {
                'summary' : event.eventName,
                'description' : event.description,
                'start' : {
                    'dateTime': event.startTime,
                    'timeZone': TIME_ZONE,
                },
                'end' : {
                    'dateTime': event.endTime,
                    'timeZone': TIME_ZONE
                },
                "visibility": "confidential",
                "status": 'confirmed'
            }
        }, (err, res)=> {
            if(err) {
                console.log('Rejecting because of error');
                reject(err);
            }
            console.log('Request successful', res);
            resolve(res.data);
        });
    });
}

function sendEmail( auth, userId, emailContent){
    return new Promise( (resolve, reject) =>{
        mail.users.messages.send({
            auth: auth,
            userId : 'me',
            resource : {
                'raw' : emailContent
            }, 
        }, (err, res)=>{
            if(err) {
                console.log('Rejecting because of error');
                reject(err);
            }
            console.log('Request successful', res);
            resolve(res.data);
        }
        );
    });
}

