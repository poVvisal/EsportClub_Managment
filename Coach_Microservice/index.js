const express = require('express');
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// --- Importing our schemas and DB connection ---
const dbconnect = require('./dbconnect.js');
const ScheduleModel = require('./schedule_schema.js');
const VodModel = require('./vod_schema.js');
const PersonModel = require('./person_schema.js');

// Helper function to generate a unique ID
function uniqueid(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
// =================================================================================
//  THE HTML GENERATOR - V4 with Colors Reverted and Fonts/Dates Fixed
// =================================================================================
function generateCoachHTML(title, message, data) {
    let dataHtml = '';

    if (Array.isArray(data)) {
        // RENDER A TABLE FOR THE ROSTER
        dataHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 25%;">Name</th>
                        <th style="width: 35%;">Email</th>
                        <th style="width: 20%;">Mobile</th>
                        <th style="width: 20%;">Role</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(player => `
                        <tr>
                            <td>${player.name}</td>
                            <td>${player.emailid}</td>
                            <td>${player.mobile}</td>
                            <td>${player.role}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (data) {
        // RENDER A LIST FOR SINGLE ITEMS (Match, VOD)
        const dataObject = data.toObject ? data.toObject() : data;
        dataHtml = '<div class="data-list">';
        for (let [key, value] of Object.entries(dataObject)) {
            if (key !== '__v' && key !== '_id') {
                // *** DATE FORMATTING FIXED FOR REAL ***
                // Now formats to a simple "Month Day, Year" format. No timezone crap.
                if (key === 'matchDate') {
                    value = new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }).format(new Date(value));
                }
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                dataHtml += `<p><span class="label">${formattedKey}:</span> ${value}</p>`;
            }
        }
        dataHtml += '</div>';
    }

    return `
    <html>
    <head>
        <title>Coach Command Center</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Exo+2:wght@700&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
        <style>
            /* --- COLORS REVERTED TO THE BLUE THEME --- */
            :root {
                --background: #111827;
                --surface: #1F2937;
                --primary: #38BDF8; /* Back to Blue */
                --text-primary: #E5E7EB;
                --text-secondary: #9CA3AF;
                --surface-darker: #374151;
            }
            body {
                font-family: 'IBM Plex Sans', sans-serif;
                background: var(--background);
                color: var(--text-primary);
                padding: 40px;
                margin: 0;
            }
            .container {
                background: var(--surface);
                border: 2px solid var(--primary);
                border-radius: 16px;
                max-width: 800px;
                margin: auto;
                padding: 40px;
                box-shadow: 0 0 30px rgba(56, 189, 248, 0.3);
            }
            h1 {
                font-family: 'Exo 2', sans-serif;
                color: var(--primary);
                font-size: 2.5em;
                margin: 0 0 10px 0;
                text-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
            }
            .coach-msg {
                font-family: 'Caveat', cursive; /* NEW FONT for this message */
                font-size: 1.7em; /* Script fonts need to be a bit bigger */
                color: var(--text-secondary);
                margin-bottom: 25px;
                border-left: 3px solid var(--primary);
                padding-left: 15px;
            }
            .data-list p { background: var(--surface-darker); padding: 12px; border-left: 4px solid var(--primary); border-radius: 4px; margin: 10px 0; }
            .data-list .label { font-weight: 500; color: var(--text-primary); }
            .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                table-layout: fixed;
            }
            .data-table th, .data-table td {
                padding: 16px;
                text-align: left;
                border-bottom: 1px solid var(--surface-darker);
                vertical-align: middle;
                overflow-wrap: break-word;
            }
            .data-table th {
                background-color: var(--primary);
                color: #111827;
                font-weight: 500;
            }
            .data-table tbody tr:nth-child(even) { background-color: var(--surface); }
            .data-table tbody tr:hover { background-color: var(--surface-darker); transition: background-color 0.2s ease-in-out; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>${title}</h1>
            <p class="coach-msg">${message}</p>
            ${dataHtml}
        </div>
    </body>
    </html>`;
}
// =================================================================================
//  API ENDPOINTS - Now upgraded with async/await and HTML responses
// =================================================================================

// POST /schedule - Create a new match
app.post('/schedule', async (req, res) => {
    console.log("CREATING NEW MATCH");
    try {
        const newMatch = new ScheduleModel({
            matchId: uniqueid(1000, 9999),
            opponent: req.body.opponent,
            matchDate: req.body.matchDate,
            game: req.body.game
        });
        const doc = await newMatch.save();
        const html = generateCoachHTML('MATCH SCHEDULED!', 'Good call, Coach. The new match is on the books and the team is ready.', doc);
        res.status(201).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// POST /assignvod - Assign a VOD for a player to review
app.post('/assignvod', async (req, res) => {
    console.log(`ASSIGNING VOD FOR MATCH ${req.body.matchId} TO PLAYER ${req.body.playerEmail}`);
    try {
        const newVod = new VodModel({
            vodId: uniqueid(1000, 9999),
            matchId: req.body.matchId,
            assignedToPlayerEmail: req.body.playerEmail
        });
        const doc = await newVod.save();
        const html = generateCoachHTML('VOD ASSIGNED!', 'Time for some homework. This VOD review will give us the edge.', doc);
        res.status(201).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// GET /roster - Get a list of all registered players
app.get('/roster', async (req, res) => {
    console.log("FETCHING TEAM ROSTER");
    try {
        const players = await PersonModel.find({ role: 'player' }, { pass: 0, __v: 0, _id: 0 });
        const html = generateCoachHTML('TEAM ROSTER', 'Here are your legends, Coach. Ready for their next command.', players);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message || 'Error fetching roster' });
    }
});

// Start the server on port 5003
app.listen(5003, () => console.log('Coach Microservice running on Port 5003'));