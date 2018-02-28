let IGNORE_TO_START_OF_CONTEST = false

function getCellValue(row, cellid) {
    return row.cells[cellid].textContent
}

function setCellValue(row, cellid, value) {
    row.cells[cellid].textContent = value
}

function getData(key, defaultValue) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get({[key]: defaultValue}, (obj) => {
            resolve(obj[key])
        });
    })
}

function storeData(key, value) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({[key]: value}, resolve)
    })
}

async function getContests() {
    return await getData("contests", {})
}

async function setContests(contests) {
    await storeData("contests", contests)
}

function getContestMessage(contest){
    let message;
    if (contest === undefined) {
        message = "Nav inicializēts"
    } else if (!contest.log) {
        message = "Rezultātu ievākšana atspējota"
    } else if (!contest.started) {
        message = "Gaida sacensību sākumu"
    } else {
        message = "Ievāc rezultātus"
    }
    return message
}

async function getContest(id) {
    return (await getContests())[id]
}
