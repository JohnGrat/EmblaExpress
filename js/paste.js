
function bindPaste(showIcon) {

    if (typeof g_form != 'undefined') {
        if (showIcon && jQuery != 'undefined')
            jQuery('#header_add_attachment').after('<button id="header_paste_image" title="Paste screenshot as attachment" class="btn btn-icon glyphicon glyphicon-paste navbar-btn" aria-label="Paste Image as Attachments" data-original-title="Paste Image as Attachments" onclick="tryPaste()"></button>');
        document.querySelector('body').addEventListener('paste', (e) => {
            if (e.clipboardData.items.length > 0 && e.clipboardData.items[0].kind == "file") {
                if (g_form.isNewRecord()) {
                    g_form.clearMessages();
                    g_form.addWarningMessage('Please save record before pasting...');
                    return false;
                }
                g_form.addInfoMessage('<span class="icon icon-loading"></span> Pasted image being processed...');
                snuDoPaste(e.clipboardData.items[0].getAsFile(), g_form.getTableName(), g_form.getUniqueValue());

            }
        });
    }
    else { //try determine record in workspace
        document.querySelector('body').addEventListener('paste', (e) => {
            var tableName; var sysId;
            var parts = document.location.pathname.split("/");
            var idx = parts.indexOf("sub") // show subrecord if available
            if (idx != -1) parts = parts.slice(idx);
            idx = parts.indexOf("record")
            if (idx > -1 && parts.length >= idx + 2) {
                tableName = parts[idx + 1];
                sysId = parts[idx + 2];
            }
            if (tableName && sysId) {
                if (e.clipboardData.items.length > 0 && e.clipboardData.items[0].kind == "file") {
                    snuDoPaste(e.clipboardData.items[0].getAsFile(), tableName, sysId);
                }
            }
        });

    }

    function snuDoPaste(fileInfo, tableName, sysId) {
        var fr = new FileReader();
        fr.onloadend = function () {
            var imgData = getBlob(fr.result);
            snuSaveImage(imgData, fileInfo, tableName, sysId);
        };
        fr.readAsDataURL(fileInfo);
    }
}

function getBlob(encoded) {
    encoded = encoded.replace(/^data:image\/(png|jpeg);base64,/, "");
    var sliceSize = 1024;
    var byteCharacters = atob(encoded);
    var bytesLength = byteCharacters.length;
    var slicesCount = Math.ceil(bytesLength / sliceSize);
    var byteArrays = new Array(slicesCount);

    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, {
        type: "image/png"
    });
}

function snuSaveImage(imgData, fileInfo, tableName, sysId) {

    var URL = "/api/now/attachment/file?table_name=" +
    tableName + "&table_sys_id=" + sysId + "&file_name=" + fileInfo.name;

    var request = new XMLHttpRequest();
    request.open("POST", URL, true);
    request.setRequestHeader('Cache-Control', 'no-cache');
    request.setRequestHeader('Accept', 'application/json');
    request.setRequestHeader('Content-Type', fileInfo.type);
    if (g_ck) request.setRequestHeader('X-UserToken', g_ck);

    request.onload = function (resp) {
        if (this.status >= 200 && this.status < 400) {
            var r = JSON.parse(this.response);
            if (typeof g_form != 'undefined') {
                g_form.clearMessages();
                g_form.addInfoMessage("<span>Pasted image added as attachment<br /><a href='/" + r.result.sys_id + ".iix' target='myimg'><img src='" + r.result.sys_id + ".iix?t=small' alt='upload' style='display:inline!important; padding:20px;'/></a><br />" +
                    `<div class="input-group">
                <input id='tbxImageName' onKeyUp='if (event.keyCode == 13) renamePasted("` + r.result.sys_id + `")' type="text" value="` + r.result.file_name.replace('.png', '') + `" style='width:200px;'class="form-control" placeholder="Image name">
                <span class="input-group-btn" style="display: inline; ">
                <button class="btn btn-primary" onClick='renamePasted("` + r.result.sys_id + `")' style="width: 80px;" type="button">.png Save..</button>
                </span>
            </div><span id='divRenamed'></span></form>`);
                jQuery('#tbxImageName').focus().select();
            }
        } else {
            //callback(this);
        }
    };
    request.onerror = function (error) {
        console.log(error);
        if (typeof g_form != 'undefined') {
            g_form.clearMessages();
            g_form.addErrorMessage(error.responseJSON.error.detail);
        }
    };
    request.send(imgData);
}


function renamePasted(sysID, check) {

    if (!$j('#tbxImageName').val()) {
        alert("Please insert a valid filename.");
        return false;
    }
    var requestBody = {
        "file_name": $j('#tbxImageName').val() + ".png"
    };
    var client = new XMLHttpRequest();
    client.open("put", "/api/now/table/sys_attachment/" + sysID);
    client.setRequestHeader('Accept', 'application/json');
    client.setRequestHeader('Content-Type', 'application/json');
    if (typeof g_ck != 'undefined')
        client.setRequestHeader('X-UserToken', g_ck);

    client.onreadystatechange = function () {
        if (this.readyState == this.DONE) {
            if (this.status == 200)
                document.getElementById("divRenamed").textContent = " Filename saved!";
            else
                document.getElementById("divRenamed").textContent = this.status + this.response;
        }
    };
    client.send(JSON.stringify(requestBody));
}


bindPaste(true);
