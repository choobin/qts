function $(id) {
    return document.getElementById(id);
}

function qts_update() {
    var id = parseInt(localStorage["qts_context_menu_id"]);

    var site_index = parseInt(localStorage["qts_site_index"]) || 0;

    var title = "Search " + torrent_sites[site_index].name + " for \"%s" + "\"";

    chrome.contextMenus.update(id, {"title": title});
}

function qts_onchange() {
    localStorage["qts_site_index"] = $("sites_list").selectedIndex;
    qts_update();
}

function qts_onclick(id) {
    localStorage["qts_" + id + "_checked"] = $(id).checked;
    qts_update();
}

function done() {
    window.close();
}

document.addEventListener('DOMContentLoaded', function () {
    var site_index = parseInt(localStorage["qts_site_index"]) || 0;

    $('sites_list').selectedIndex = site_index;

    $('sites_list').addEventListener('change', qts_onchange);

    var switch_checked = localStorage["qts_switch_checked"] || "true";

    $("switch").checked = (switch_checked === "true") ? true : false;

    $('switch').addEventListener('click', function() { qts_onclick("switch") });

    var next_checked = localStorage["qts_next_checked"] || "true";

    $("next").checked = (next_checked === "true") ? true : false;

    $('next').addEventListener('click', function() { qts_onclick("next") });

    $('close').addEventListener('click', done);
});
