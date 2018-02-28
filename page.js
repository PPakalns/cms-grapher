let last_update = 0

function getId() {
    return $.url("?id")
}

function drawHeader(results) {
    let columns = ["User"]
    Object.keys(results).forEach((elem) => {
        if (elem == "Global")
            return
        columns.push(elem)
    })
    columns.push("Global")

    elem = $("#contest_table thead")
    elem.empty()
    for (let idx in columns) {
        let th = document.createElement("th")
        th.textContent = columns[idx]
        elem.get(0).appendChild(th)
    }
    return columns
}

function createRow(cell_cnt) {
    let row = document.createElement("tr")
    for (let i = 0; i < cell_cnt; i++) {
        let td = document.createElement("td")
        row.appendChild(td)
    }
    return row
}

function drawBody(order, columns, cresults) {
    $("#contest_table tbody").empty()
    tbody = document.querySelector("#contest_table tbody")
    for (let i in order) {
        let username = order[i];
        let row = createRow(columns.length)
        tbody.appendChild(row)

        let scores = cresults[username] || {}

        for (let i in columns)
        {
            if (columns[i] == "User") {
                setCellValue(row, i, username)
                continue
            }

            setCellValue(row, i, scores[columns[i]] || 0)
        }
    }
}

function convertResults(results) {
    let cResults = {}
    Object.keys(results).forEach((task) => {
        let task_results = results[task]
        Object.keys(task_results).forEach((username) => {
            if (cResults.hasOwnProperty(username) == false) {
                cResults[username] = {}
            }
            let res = task_results[username].res
            cResults[username][task] = res.length > 0 ? res[res.length - 1].score : 0;
        })
    })
    return cResults;
}

async function popolateData() {
    $("#contest_id>span").text(getId())
    let contest = await getContest(getId())
    let message = await getContestMessage(contest)
    $("#contest_state>span").text(message)

    if (contest == undefined)
        return

    last_update = contest.last_update

    $("#last_update").text(
        "Last update: "
        + (new Date(last_update)).toLocaleDateString()
        + " "
        + (new Date(last_update)).toLocaleTimeString()
    )

    let results = await getData(getId(), {"Global": {}})
    let columns = drawHeader(results)
    let cresults = convertResults(results)

    // Sort by Global score
    let global_scores = []
    Object.keys(cresults).forEach((name) => {
        global_scores.push({"User": name, "Global": cresults[name]["Global"] || 0})
    })
    global_scores.sort((x,y) => {return y["Global"] - x["Global"]});

    let ordered = []
    for (let i = 0; i < global_scores.length; i++) {
        ordered.push(global_scores[i]["User"])
    }
    drawBody(ordered, columns, cresults)
}

function storageChanged(changes, areaName) {
    if (areaName != "local") {
        return
    }
    if (changes.hasOwnProperty("contests") == false) {
        return
    }

    let contests = changes["contests"].newValue
    let contest = contests[getId()]

    let update = false
    if (contest == undefined || contest.last_update > last_update) {
        update = true
    }

    if (update)
    {
        console.log("Contest results updated")
        popolateData()
    }
}

$(document).ready(() => {
    popolateData()
    chrome.storage.onChanged.addListener(storageChanged)
})
