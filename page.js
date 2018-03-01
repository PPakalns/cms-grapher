let last_update = 0

function getRandomColor() {
    var arr = [0, 0, 0];
    do{
        for (var i = 0; i < 3; i++) {
            arr[ i ] = Math.floor(Math.random() * 255);
        }
    } while (arr[ 0 ]>200 && arr[ 1 ]>200 && arr[ 2 ]>200);
    return function(alpha) {
        var color = 'rgba('+arr[ 0 ]+','+arr[1]+","+arr[2]+',' + alpha + ')';
        console.log(color)
        return color;
    }
}

function getRandomColor2() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

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

        let scores = cresults[username] || {}

        // if (scores["Global"] == 0) {
        //     if (user_row.hasOwnProperty(username)) {
        //         delete user_row[username]
        //     }
        //     continue
        // }
        tbody.appendChild(row)

        for (let i in columns)
        {
            if (columns[i] == "User") {
                setCellValue(row, i, username)
                continue
            }

            setCellValue(row, i, scores[columns[i]] || 0)
        }

        user_row[username] = row
        updateRowVisibility(username)

        row.addEventListener('click', () => {
            toggleVisibility(username)
        })
    }
}

function convertResults(results, task_list) {
    task_list = task_list || []
    let cResults = {}
    Object.keys(results).forEach((task) => {
        task_list.push(task)
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

let displayed = {}
let user_color = {}
let user_row = {}

let charts = []
let chart_names = []

function createUserDataSet(username){
    return {
        label: username,
        steppedLine: 'before',
        borderWidth: 2,
        pointRadius: 2,
        data: [],
        borderColor: getUserColor(username),
        fill: false,
        hidden: false
    }
}

function AddChart(task) {
    console.log("Create chart", task)
    let graphs = document.getElementById("graphs")
    let div = document.createElement("div")

    let canvas = document.createElement('canvas');
    div.appendChild(canvas);
    graphs.appendChild(div)

    let ctx = canvas.getContext('2d');
    let config = {
        type: 'line',
        data: {
            datasets: []
        },
        options: {
            legend: {
                display: false
            },
            tooltips: {
                enabled: true
            },
            responsive: true,
            scales: {
                xAxes: [{
                    type: 'time',
                    // position: 'top'
                }],
                yAxes: [{
                    display: true,
                    ticks: {
                        suggestedMin: 0,    // minimum will be 0, unless there is a lower value.
                        suggestedMax: ((task == "Global") ? 300 : 100),    // minimum will be 0, unless there is a lower value.
                    }
                }]
            },
            title: {
                display: true,
                text: (task == "Global") ? task : "Uzdevums: " + task,
            }
        }
	};

    charts.push(new Chart(ctx, config));
    chart_names.push(task)
}

function getChartCmsData(chart) {
    chart["cms_data"] = chart["cms_data"] || {}
    return chart["cms_data"]
}

function updateChartVisibility(username) {
    let is_hidden = !getUserDisplayed(username)

    for (let i = 0; i < charts.length; i++) {
        let chart = charts[i]
        let chart_cms_data = getChartCmsData(chart)
        if (chart_cms_data.hasOwnProperty(username)) {
            chart_cms_data[username].hidden = is_hidden
            chart.update()
        }
    }
}

function updateRowVisibility(username) {
    if (user_row.hasOwnProperty(username)) {
        user_row[username].style.backgroundColor = "initial";
        if (getUserDisplayed(username)) {
            user_row[username].style.backgroundColor = getUserColor(username, 0.5);
        }
    }
}

function getUserDisplayed(username) {
    if (displayed.hasOwnProperty(username) == false) {
        displayed[username] = true
    }
    return displayed[username]
}

function getUserColor(username, opacity) {
    if (opacity === undefined)
        opacity = 1
    if (user_color.hasOwnProperty(username) == false) {
        user_color[username] = getRandomColor()
    }
    return user_color[username](opacity)
}

function setDisplayed(username, visible) {
    displayed[username] = visible

    updateChartVisibility(username)
    updateRowVisibility(username)
}

function toggleVisibility(username) {
    setDisplayed(username, !getUserDisplayed(username))
}

function updateGraph(results, i) {
    let chart = charts[i]
    let task = chart_names[i]
    let chart_cms_data = getChartCmsData(chart)

    let task_results = results[task] || {}

    Object.keys(task_results).forEach((username) => {
        if (chart_cms_data.hasOwnProperty(username) == false) {
            chart_cms_data[username] = createUserDataSet(username)
            chart_cms_data[username].hidden = !getUserDisplayed(username)
            chart.data.datasets.push(chart_cms_data[username])
        }
        let line_data = chart_cms_data[username].data

        // Clear array contents
        line_data.length = 0

        let res = task_results[username].res

        for (let i = 0; i < res.length; i++) {
            line_data.push({t: res[i].time, y: res[i].score + (Math.random() * 0.1 - 0.05)})
        }
    })

    chart.update()
}

function drawGraphs(results, task_names) {
    if (chart_names.indexOf("Global") == -1) {
        AddChart("Global")
    }

    for (let i = 0; i < task_names.length; i++)
    {
        if (chart_names.indexOf(task_names[i]) == -1) {
            AddChart(task_names[i])
        }
    }

    for (let i = 0; i < chart_names.length; i++) {
        updateGraph(results, i)
    }
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
    let task_names = []
    let cresults = convertResults(results, task_names)

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

    drawGraphs(results, task_names)
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

function getSelector(state) {
    // Set all user display state to state
    return function() {
        Object.keys(displayed).forEach((username) => {
            setDisplayed(username, state)
        })
    }
}

$(document).ready(() => {
    popolateData()
    chrome.storage.onChanged.addListener(storageChanged)

    $("#select_all").click(getSelector(true))
    $("#remove_all").click(getSelector(false))
})
