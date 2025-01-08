const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
require('dotenv').config();

// To handle JSON payloads from the frontend
app.use(express.json());

app.use('/html', express.static(path.join(__dirname, 'html')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

app.post('/ask', async (req, res) => {
    try {
        const question = req.body.question;
        const systemOriginal = `You will be given a google like seach, for what ever topic, FOCUS ON LOCATIONS. You could even try taking the user input and adding "show me locations relevant to: " or for example if the input is "messi" turn that into "what locations are stadiums that messi has played"
        1. Start by providing a brief answer/summary of what ever was asked.
        2. If locations are found, After all summaries, provide a consolidated list of location details. Clearly label this section with "data:".
        3. Beneath this label, provide all location details in ONE JSON array format. Each entry should include 'name', 'latitude', and 'longitude'.
        Example:
        - Summary for location 1
        - Summary for location 2
        
        data:
        [       {        "name": "location 1 name",        "latitude": "51.00",        "longitude": "54.00"    },    {        "name": "location 2 name",        "latitude": "35.00",        "longitude": "47.00"    }]
        
        `; 

        const system = `You will be given a google like search. I want you to forge a brief history of whatever the subject is, that we will demonstrate locationally on a map. Whatever the subject is, be it broad like a war, or specific like an invention, we will make a spelled out history of the topic. For what ever topic, FOCUS ON LOCATIONS.  You could even try taking the user input and adding "show me locations relevant to: " or for example if the input is "messi" turn that into "what locations are stadiums that messi has played in historical order."
                        An example for an input just like "glen arm maryland" should of course locate that town, but should also consider the history of when it was established, and where people who settled it came from.
                        An example like "rubiks cube" should show the invention of the toy in hungary, but should show the evolution to speedcubing spread across the world with major locations of the best solves.
                        An example like "giraffe" should show where giraffes live in different areas ranked by population count, or something locaitonal from such a simple prompt.
        1. Start by providing a brief summary of the history and important points of what ever was asked.
        2. If locations are found, After all summaries, provide a consolidated list of location details. Clearly label this section with "data:".
        3. Beneath this label, provide all location details in ONE JSON array format. Each entry should include 'name', 'latitude', and 'longitude'.
        Example:
        - Summary for location 1
        - Summary for location 2
        
        data:
        [       {        "name": "location 1 name",        "latitude": "51.00",        "longitude": "54.00"    },    {        "name": "location 2 name",        "latitude": "35.00",        "longitude": "47.00"    }]
        
        `; 

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                  "role": "system",
                  "content": system
                },
                {
                    "role": "user",
                    "content": question
                }
            ],
            temperature: 1,
            max_tokens: 256,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
        });

        if (!response.data.choices || !response.data.choices[0]) {
            throw new Error('Unexpected response from OpenAI');
        }

        const answerData = response.data.choices[0].message;
        const answer = answerData ? answerData.content.trim() : "Error fetching answer.";
        res.json({ answer });
    } catch (error) {
        console.error("Error in /ask route:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error querying OpenAI' });
    }
});

app.get('/getGoogleMapsApiKey', (req, res) => {
    console.log("Sending Google Maps API key");
    res.json({ key: process.env.GOOGLE_MAPS_API_KEY });
});

app.listen(3000, () => {
    console.log('App is running on http://localhost:3000');
});
