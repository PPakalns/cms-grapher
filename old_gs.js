function getRandomColor() {
    var arr = [0, 0, 0];
    do{
        for (var i = 0; i < 3; i++ ) {
            arr[ i ] = Math.floor(Math.random() * 230);
        }
    } while (arr[ 0 ]>170 && arr[ 1 ]>170 && arr[ 2 ]>170);
    var color = 'rgba('+arr[ 0 ]+','+arr[1]+","+arr[2]+',1)';
    return color;
}

function getRandomColor2() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function displayRes(usern, dispname)
{
    console.log("Displaying results");
    var the = $("#core>table").get(0).tHead;
    var tbl = $("#core>table");
    tbl.before('<br><canvas id="myChart" width="1580" height="780" style="max-width: 1580px; max-height:780px;"></canvas>');
    $("#myChart").hide(0);
    tbl = tbl.get(0).tBodies[ 0 ];

    var userncell = findColumnInRow(usern, the.rows[ 0 ]);
    var dispcell = findColumnInRow(dispname, the.rows[ 0 ]);
    var results = JSON.parse(GM_getValue(encodedkey, "{}"));
    var datasetsF = {};
    var dispGraph = function(){
        $("#myChart").show(100);
        var ctx = $("#myChart");
        var lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: Object.values(datasetsF)
            },
            options: {
                legend: {
                    display: dispLegend
                },
                scales: {
                    xAxes: [{
                        type: 'linear',
                        position: 'top'
                    }]
                }
            }
        });
    };
    var initshow=false;
    console.log("adding events");
    for(var i=0, len=tbl.rows.length; i<len; i++){
        var row = tbl.rows[i];
        var username = getContent(row, userncell);
        var dispname = getContent(row, dispcell);
        var data = [];
        var arr = results[username].res;
        var opened = JSON.parse(GM_getValue(encodedkey+"o", "{}"));
        var lasty = -1;
        var yrand = 0;
        if (arr.length>0)
        {
            var starttime = arr[ 0 ].time/60000;
            for (let i=0, len=arr.length; i<len; i++)
            {
                var x = parseFloat((( arr[ i ].time / 60000.0 ) - starttime).toFixed(2));
                if (arr[ i ].score != lasty)
                    {
                        yrand = Math.random() - 0.5;
                        lasty = arr[ i ].score;
                    }
                var y = arr[ i ].score + yrand;
                y = Math.max(0, Math.min(y, 300));
                data.push({x:x,y:y});
            }
        }
        (function(row, results, username, dispname, data){
            var visible=(opened[username]==true);
            var show=function()
            {
                let randCol = getRandomColor();
                console.log("Display", username);
                datasetsF[ username ] = {label: dispname, data: data, fill: false,
                    borderColor: randCol, tension: 0, borderWidth: 2, pointRadius: 0};
                $(row).css("font-style","italic");
                $(row.cells[ 0 ]).css("background-color",randCol);
                visible = true;
            };

            if (visible==true)
            {
                show();
                initshow=true;
            }

            row.addEventListener("click", function()
                {
                if (visible == false)
                {
                    show();
                    opened[username]=true;
                }
                else // visible = true
                {
                    console.log("Hide", username);
                    $(row.cells[ 0 ]).css("background-color","");
                    opened[username]=false;
                    visible=false;
                    delete datasetsF[ username ];
                }
                GM_setValue(encodedkey+"o", JSON.stringify(opened));
                dispGraph();
                console.log("Done");
                });
        })(row, results, username, dispname, data);
    }
    if (initshow==true)
    {
        dispGraph();
    }
    console.log("events added");

    console.log("Buttons");
    $("#myChart").before('<div style="display: inline-block; padding:5px; margin-right: 5px; background-color: #FFaaaa;" id="clearchart">Notīrīt</div>\
                          <div style="display: inline-block; padding:5px; background-color: #bbFFbb;" id="fullchart">Visi</div><br>');
    $("#clearchart").click(function(){
        GM_setValue(encodedkey+"o", JSON.stringify({}));
        location.reload();
    });
    $("#fullchart").click(function(){
        var opened = {};
        for (var property in results) {
            if (results.hasOwnProperty(property)) {
                opened[property]=true;
            }
        }
        GM_setValue(encodedkey+"o", JSON.stringify(opened));
        location.reload();
    });
    console.log("End");
}

// displayRes("Username", "User");
