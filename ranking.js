
// <div id="contest_id">
//     Contest: <span></span>
// </div>
// <div id="contest_state">
//     State: <span></span>
// </div>
// <div id="last_update">
// </div>

let active_contests = {}

let stored_top = false
let start = new Date()
let show = 0

async function updateContest(cid, total_values, task_list) {
    let contest = await getContest(cid)
    if (contest === undefined) {
        console.error("UNDEFINED CONTEST")
        return
    }
    let local_contest = active_contests[cid]

    local_contest.last_update = contest.last_update
    local_contest.cdiv.innerHTML = "Contest: <span>" + cid + "</span>"
    let message = getContestMessage(contest)
    local_contest.sdiv.innerHTML = "State: <span>" + message + "</span>"
    local_contest.ldiv.innerHTML = "Last update: "
                                + (new Date(contest.last_update)).toLocaleDateString()
                                + " "
                                + (new Date(contest.last_update)).toLocaleTimeString()

    let results = await getData(cid, 0)
    if (results == 0) {
        console.log("UNDEFINED RESULTS")
        return
    }

    let ctask_list = []
    let cresults = convertResults(results, ctask_list)
    if (ctask_list.indexOf("Global") != -1) {
        ctask_list.splice(ctask_list.indexOf("Global"), 1)
    }
    ctask_list.sort()
    Array.prototype.push.apply(task_list, ctask_list)

    Object.keys(cresults).forEach((name) => {
        if (total_values.hasOwnProperty(name) == false) {
            total_values[name] = {}
        }
        let user_total = total_values[name]
        let user_contest = cresults[name]

        Object.keys(cresults[name]).forEach((task) => {
            if (user_total.hasOwnProperty(task) == false)
                user_total[task] = 0
            user_total[task] += user_contest[task]
        })
    })
}

function drawHeader(task_list) {
    let columns = ["User"]
    Array.prototype.push.apply(columns, task_list)
    columns.push[""]

    elem = $("#total_table thead")
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

function drawBody(order, task_list, cresults) {
    let columns = ["User"]
    Array.prototype.push.apply(columns, task_list)
    columns.push("")

    $("#total_table tbody").empty()
    tbody = document.querySelector("#total_table tbody")
    for (let i in order) {
        let username = order[i];
        let row = createRow(columns.length)

        let scores = cresults[username] || {}

        tbody.appendChild(row)

        for (let j in columns)
        {
            if (columns[j] == "User") {
                setCellValue(row, j, username)
                continue
            }

            if (columns[j] == "") {
                vv = ""
                if (i < 2)
                    vv = " I "
                else if (i < 2 + 3)
                    vv = " II "
                else if (i < 2 + 3 + 4)
                    vv = " III "
                setCellValue(row, j, vv)
                row.cells[j].style.paddingLeft = "8px"
                row.cells[j].style.paddingRight = "8px"
                row.cells[j].style.textAlign = "center"
                continue
            }

            setCellValue(row, j, scores[columns[j]] || 0)
        }
    }
}

async function updateRes() {
    let total_values = {}
    let task_list = []
    for (let cid in active_contests) {
        if (active_contests.hasOwnProperty(cid) == false)
            continue

        await updateContest(cid, total_values, task_list)
    }
    task_list.push("Global")

    // Sort by Global score
    let global_scores = []
    Object.keys(total_values).forEach((name) => {
        global_scores.push({"User": name, "Global": total_values[name]["Global"] || 0})
    })
    global_scores.sort((x,y) => {return y["Global"] - x["Global"]});

    let ordered = []
    for (let i = 0; i < global_scores.length; i++) {
        ordered.push(global_scores[i]["User"])
    }

    function arrMatch(a1, a2) {
        if (a1.length != a2.length) {
            return false;
        }
        for (let i = 0; i < a1.length; i++) {
            if (a1[i] != a2[i])
                return false;
        }
        return true;
    }

    let top = ordered.slice(0, 9)
    if (((new Date()) - start) > 10000) {
        if (stored_top == 0 || arrMatch(stored_top, top) == false) {
            $("#gifdiv").show()
            show = show + 1
            setTimeout(() => {
                show = show - 1
                if (show == 0) {
                    $("#gifdiv").hide()
                }
            }, 5000)
        }
    }
    stored_top = top

    drawHeader(task_list)
    drawBody(ordered, task_list, total_values)
}

async function addContest() {
    start = new Date()

    let id = $("#id_input").val().trim()
    let data = await getData(id, 0)

    if (data == 0) {
        console.log("BAD CONTEST ID")
        return
    }

    if (active_contests.hasOwnProperty(id)) {
        console.log("Contest already logged")
        return
    }

    $("#id_input").val("")

    active_contests[id] = {}

    wdiv = document.createElement("div")
    cdiv = document.createElement("div")
    wdiv.appendChild(cdiv)
    active_contests[id]["cdiv"] = cdiv

    sdiv = document.createElement("div")
    wdiv.appendChild(sdiv)
    active_contests[id]["sdiv"] = sdiv

    ldiv = document.createElement("div")
    wdiv.appendChild(ldiv)
    active_contests[id]["ldiv"] = ldiv

    active_contests[id]["last_update"] = 0

    document.getElementById("contests").appendChild(wdiv)

    updateRes()

    console.log("Contest added", id)
}

function storageChanged(changes, areaName) {
    if (areaName != "local") {
        return
    }
    if (changes.hasOwnProperty("contests") == false) {
        return
    }

    let contests = changes["contests"].newValue

    let update = false
    Object.keys(active_contests).forEach((cid) => {
        if (contests.hasOwnProperty(cid)) {
            if (contests[cid].last_update > active_contests[cid].last_update) {
                update = true
            }
        }
    })

    if (update)
        updateRes()
}

$(document).ready(() => {
    $("#id_submit").click(addContest)
    chrome.storage.onChanged.addListener(storageChanged)
})
