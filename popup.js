async function getId() {
    return "id:" + await getCurrentTabUrl()
}

function getCurrentTabUrl() {
    return new Promise((resolve, reject) => {
        let queryInfo = {
            active: true,
            currentWindow: true
        };

        chrome.tabs.query(queryInfo, (tabs) => {
            var tab = tabs[0];
            var url = tab.url;
            resolve(url);
        });
    })
}

function reloadPage() {
    chrome.tabs.query({active: true, currentWindow: true}, function (arrayOfTabs) {
        chrome.tabs.reload(arrayOfTabs[0].id);
    });
}

async function updateState() {
    let contest = await getContest(await getId())
    let message = await getContestMessage(contest);
    document.getElementById("state").innerHTML = message

    $("#init_contest").toggle(contest === undefined)
    $("#graph_page").toggle(contest !== undefined)
    $("#toggle_logging").toggle(contest !== undefined)
}

async function initContest() {
    let contests = await getContests()
    let id = await getId()
    if (contests.hasOwnProperty(id))
    {
        return;
    }
    contests[id] = {log: true, started: false, ended: false, last_update: 0}
    await setContests(contests)
    await updateState()
    reloadPage()
}

async function toggleLogging() {
    let contests = await getContests()
    let contest = contests[await getId()]
    contest.log = !contest.log
    await setContests(contests)
    await updateState()
    reloadPage()
}

function storageChanged(changes, areaName) {
    if (areaName != "local") {
        return
    }
    if (changes.hasOwnProperty("contests") == false) {
        return
    }
    updateState()
}

async function openPage() {
    let url = chrome.extension.getURL('page.html') + "?id=" + encodeURIComponent(await getId())
    chrome.tabs.create({url: url})
}

async function openTotalPage() {
    let url = chrome.extension.getURL('ranking.html')
    chrome.tabs.create({url: url})
}

$(document).ready(() => {
    updateState();
    $("#init_contest").click(initContest)
    $("#toggle_logging").click(toggleLogging)
    $("#graph_page").click(openPage)
    $("#contest_total").click(openTotalPage)

    chrome.storage.onChanged.addListener(storageChanged)
})

function clearAllContests() {
    chrome.storage.local.remove("contests")
}
