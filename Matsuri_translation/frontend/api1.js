function submit_task() {
    var url = $('#url').val();
    //var translation = $('#translation').val().replace(/\r\n|\r|\n/g, '\\r');
    $('#progress').val("开始获取图像");
    $('#url').css("display", "none");
    $('#progress').css("display", "");


    var jqxhr = $.ajax({
        url: "http://api.wudifeixue.com/api/tasks",
        type: "post",
        data: JSON.stringify({
            "url": url,
            "translation": ""
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
    }).done(function (data) {
        fetch_img(data.task_id)
    })
}

function fetch_img(task_id) {
    var count = 0;
    var locked = false;
    var event = setInterval(function () {
        if (locked) return;
        locked = true;
        count += 1;

        var jqxhr = $.getJSON('http://api.wudifeixue.com/api/get_task=' + task_id,
            function (data) {
                locked = false;
                if (data.state === "SUCCESS") {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', 'cache/' + data.result + '.png');
                    xhr.onprogress = function (event) {
                        if (event.lengthComputable) {
                            //console.log((event.loaded / event.total) * 100); // 进度
                            $('#progress').val("正在下载图片 (" + Math.round((event.loaded / event.total) * 100) + "%)");
                        }
                    };

                    xhr.onload = function (e) {
                        $("#screenshotclip0").css("background-image", 'url("cache/' + data.result + '.png")');
                        $('#url').css("display", "");
                        $('#progress').css("display", "none");
                        clip_screenshot();
                        refresh_trans_div();
                    };
                    xhr.send();
                    $.get('cache/' + data.result + '.txt', function (data, status) {
                        console.log(data);
                        show_translate(JSON.parse(data));
                    });
                    clearInterval(event);
                }
            });
        $('#progress').val("等待服务器响应，已尝试" + count + "次");
    }, 100)
}

var tweetpos;

function show_translate(data) {
    console.log(data);
    tweetpos = data;
    $("#translatetbody").html("");
    for (var i = 0; i < tweetpos.length; i++) {
        $("#translatetbody").append("<tr>\n" +
            "      <th scope=\"row\">" + i + "</th>\n" +
            "      <td>" + tweetpos[i].text + "</td>\n" +
            "      <td><textarea id='transtxt" + i + "' " + (i == 0 ? "style='height:100px'" : "") + "></textarea></td>\n" +
            "    </tr>");
        $("#transtxt" + i).keyup(refresh_trans_div);

    }

}

function clip_screenshot() {
    for (var i = 0; i < tweetpos.length; i++) {
        if (tweetpos[i].bottom > 2000) break;
        $("#screenshotclip" + i).css("height", tweetpos[i].bottom - (i == 0 ? 0 : tweetpos[i - 1].bottom));
        $("#screenshotclip" + i).after("<div class='screenshotclip' id='" + "screenshotclip" + (i + 1) + "'></div>");
        $("#screenshotclip" + (i + 1)).css("background-image", $("#screenshotclip" + i).css("background-image"));
        $("#screenshotclip" + (i + 1)).css("width", $("#screenshotclip" + i).css("width"));
        $("#screenshotclip" + (i + 1)).css("height", 2000 - tweetpos[i].bottom);
        $("#screenshotclip" + (i + 1)).css("background-position-y", -tweetpos[i].bottom);

        $("#screenshotclip" + i).after("<div class='screenshotclip' id='" + "translatediv" + i + "'></div>");
    }
}

function refresh_trans_div() {
    var template = $("#translatetemp").val();
    if (template != "") localStorage.setItem("translatetemp", template);
    for (var i = 0; i < tweetpos.length; i++) {
        $("#translatediv" + i).html("");
        if ($("#transtxt" + i).val() != "") {
            var transtxt = $("#transtxt" + i).val();
            transtxt=transtxt.split("\n").join("<br>");
            $("#translatediv" + i).html(template.replace("{T}", transtxt));
        }
    }
}

$(function () {
    $('#button-submit').click(function () {
        submit_task();
    });
    if (localStorage.getItem("translatetemp") == null) localStorage.setItem("translatetemp", '<div style="margin:10px 38px">\n' +
        '<h4 style="color:#3CF">由<img src="img/xsjgf.png" width="24"><span style="color:#FC3">夏色祭工坊</span>翻译自日语</h4>\n' +
        '<h5>{T}</h5>\n' +
        '</div>')
    $("#translatetemp").val(localStorage.getItem("translatetemp"));
    $("#translatetemp").keyup(refresh_trans_div);

});

function createAndDownloadFile(fileName, uri) {
    var aTag = document.createElement('a');
    var blob = dataURItoBlob(uri, 'png');
    aTag.download = fileName;
    aTag.href = URL.createObjectURL(blob);
    aTag.click();
    URL.revokeObjectURL(blob);
}

function dataURItoBlob(dataURI, dataTYPE) {
    var binary = atob(dataURI.split(',')[1]), array = [];
    for (var i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
    return new Blob([new Uint8Array(array)], {type: dataTYPE});
}

function downloadAsCanvas() {
    $('body')[0].scrollIntoView();
    html2canvas(document.querySelector("#screenshots")).then(canvas => {
        createAndDownloadFile("twitterImg" + new Date().getTime() + ".png", canvas.toDataURL("image/png"));
    });
}