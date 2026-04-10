const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'wego-fares-logs-WF551FPXYXM26.csv');
const text = fs.readFileSync(csvPath, 'utf-8');
const lines = text.split('\n');

const detailsLines = lines.filter(l => l.includes('/v2/details') && !l.includes('50000'));
if (detailsLines.length === 0) {
    console.log("No successful /v2/details found. Using first one.");
    const allDetails = lines.filter(l => l.includes('/v2/details'));
    if (allDetails.length > 0) {
        parseLine(allDetails[allDetails.length - 1]);
    } else {
        console.log("Not found.");
    }
} else {
    parseLine(detailsLines[detailsLines.length - 1]);
}

function parseLine(line) {
    // Basic CSV splitting (not perfect but ok for our specific column)
    // Actually we can find the JSON body since it starts with '{' and ends with '}'
    const match = line.match(/"?({.*})"?/);
    if (match) {
        let jsonStr = match[1];
        // unescape quotes
        jsonStr = jsonStr.replace(/""/g, '"');
        try {
            const data = JSON.parse(jsonStr);
            fs.writeFileSync(path.join(__dirname, 'v2_details.json'), JSON.stringify(data, null, 2));
            console.log("Extracted successfully.");
        } catch(e) {
            console.error("Parse error:", e.message);
        }
    }
}
