var site_index = localStorage["qts_site_index"] || 0;

var title = "Search " + torrent_sites[site_index].name + " for \"%s" + "\"";

var id = chrome.contextMenus.create({
    "title": title,
    "contexts": ["selection"],
    "onclick": function (info, tab) {
        var site_index = localStorage["qts_site_index"] || 0;

        var tab_switch = localStorage["qts_switch_checked"] || "true";

        var tab_next = localStorage["qts_next_checked"] || "true";

        var site = torrent_sites[site_index].url;

        var selection = encodeURIComponent(info.selectionText);

        var url = site.replace(/%s/, selection);

        var args = {
            'url': url,
            'selected': (tab_switch === "true") ? true : false
        };

        if (tab_next === "true")
            args.index = tab.index + 1;

        chrome.tabs.create(args);
    }
});

localStorage["qts_context_menu_id"] = id;
