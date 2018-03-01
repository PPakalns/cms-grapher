function AddRanking(txt) {
    document.querySelector(".core_title h1")
            .innerHTML += txt
}

function getId() {
    return "id:" + window.location.href;
}

function findColumnInRow(column_name, row) {
    for (let i=0, len=row.cells.length; i<len; i++)
    {
        let tcont = getCellValue(row, i);
        if (tcont == column_name) {
            return i;
        }
    }
    throw ("Failed to find column " + column_name)
}

function parseRankingScores(update_time, task_results, column_name) {
    let tbodies = $("#core>table").get(0).tBodies[0];
    let thead = $("#core>table").get(0).tHead;
    let score_idx = findColumnInRow(column_name, thead.rows[ 0 ]);
    let username_idx = findColumnInRow("User", thead.rows[ 0 ]);

    for(var i=0, len=tbodies.rows.length; i<len; i++) {
        let row = tbodies.rows[i];
        let username = getCellValue(row, username_idx);
        let gscore = getCellValue(row, score_idx);

        if (gscore.indexOf("*") !== -1) {
               console.log("Skip", username);
               continue;
        }

        let last_score = parseFloat(gscore);

        if (task_results.hasOwnProperty(username) == false) {
            task_results[username] = {res: []};
        }
        let res = task_results[username].res;

        let feq = (x, y) => {
            return Math.round(x * 100) == Math.round(y * 100);
        }

        while (res.length>=2
               && feq(res[res.length-1].score, res[res.length-2].score)
               && feq(res[res.length-1].score, last_score)) {
            res.pop();
        }

        res.push({time: update_time, score: last_score});
    }
}

async function updateRes() {
    let updateTime = (new Date()).getTime();
    console.log("Updating results", getId());
    console.log("Update time", updateTime)

    let contests = await getContests()
    let contest = contests[getId()]

    if (contest === undefined || !contest.log) {
        AddRanking(" - " + await getContestMessage(contest))
        return
    }

    contest.last_update = updateTime

    let elem = document.getElementById("remaining_text")
    if (!IGNORE_TO_START_OF_CONTEST
        && elem) {
        if (elem.textContent.indexOf("To start of contest") != -1) {
            AddRanking(" - " + (await getContestMessage(contest)) + " (nav sākušās)")
            return
        }

        contest.started = true

        if (elem.textContent.trim().length == 0
            || elem.textContent.indexOf("To end of analysis") != -1) {
            contest["ended"] = true
            AddRanking(" - " + await getContestMessage(contest))
            await setContests(contests)
            return;
        } else {
            contest["ended"] = false
        }
    }

    AddRanking(" - " + await getContestMessage(contest))
    let score_names = ['Global']

    // Find task names
    $("#core>table>thead>tr>th>a").each(function(){
        score_names.push(this.textContent)
    })

    let results = await getData(getId(), {})

    score_names.forEach((score_name) => {
        if (results.hasOwnProperty(score_name) == false) {
            results[score_name] = {}
        }
        parseRankingScores(updateTime, results[score_name], score_name)
    })

    contest.started = true
    await storeData(getId(), results)
    await setContests(contests)
    console.log("Rankings updated");
}

function init() {
    AddRanking("*")

    updateRes();
    // setTimeout(function(){location.reload()}, 20*1000);
}

init()
