/*
Copyright 2012 Christopher Hoobin. All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

   1. Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above
      copyright notice, this list of conditions and the following
      disclaimer in the documentation and/or other materials provided
      with the distribution.

THIS SOFTWARE IS PROVIDED BY CHRISTOPHER HOOBIN ''AS IS'' AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL CHRISTOPHER HOOBIN OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation
are those of the authors and should not be interpreted as representing
official policies, either expressed or implied, of Christopher Hoobin.
*/

Components.utils.import("resource://gre/modules/Services.jsm");

let Qts = {
    // Keep dead sites to maintain correct mapping from existing user preference to sites array index.
    sites: [
        { name: "The Pirate Bay",    uri: "http://thepiratebay.pe/search/%s/0/99/0" },
        { name: "Demonoid",          uri: "http://www.demonoid.me/files/?query=%s" }, // Dead.
        { name: "BT Junkie",         uri: "http://btjunkie.org/search?q=%s" }, // Dead.
        { name: "Torrentz",          uri: "http://torrentz.eu/any?q=%s" },
        { name: "Kickass Torrents",  uri: "http://kickass.to/search/%s/" },
        { name: "ISO Hunt",          uri: "http://isohunt.com/torrents/?ihq=%s" },
        { name: "Bitsnoop",          uri: "http://bitsnoop.com/search/all/%s/c/d/1" },
        { name: "Extra Torrent",     uri: "http://extratorrent.com/search/?search=%s" },
        { name: "Torrent Downloads", uri: "http://www.torrentdownloads.net/search/?search=%s" }, // Dead
        { name: "Torrent Reactor",   uri: "http://www.torrentreactor.net/torrent-search/%s" },
        { name: "Lime Torrents",     uri: "http://www.limetorrents.com/search/all/%s/" },
    ],

    startup: function(installPath) {
        let branch = Services.prefs.getDefaultBranch("extensions.qts@moongiraffe.net.");

        branch.setIntPref("index", 0);

        branch.setBoolPref("switch", true);

        branch.setBoolPref("next", false);

        const nsISupportsString = Components.interfaces.nsISupportsString;
        let iss = Components.classes["@mozilla.org/supports-string;1"].createInstance(nsISupportsString);
        iss.data = "";
        branch.setComplexValue("customName", nsISupportsString, iss);
        branch.setComplexValue("customURL", nsISupportsString, iss);

        let resource = Services.io
            .getProtocolHandler("resource")
            .QueryInterface(Components.interfaces.nsIResProtocolHandler);

        let alias = Services.io.newFileURI(installPath);

        if (!installPath.isDirectory()) {
            alias = Services.io.newURI("jar:" + alias.spec + "!/", null, null);
        }

        resource.setSubstitution("qts", alias);

        Services.ww.registerNotification(Qts);

        let windows = Services.wm.getEnumerator("navigator:browser");

        while (windows.hasMoreElements()) {
            Qts.add(windows.getNext());
        }
    },

    shutdown: function() {
        let resource = Services.io
            .getProtocolHandler("resource")
            .QueryInterface(Components.interfaces.nsIResProtocolHandler);

        resource.setSubstitution("qts", null);

        Services.ww.unregisterNotification(Qts);

        let windows = Services.wm.getEnumerator("navigator:browser");

        while (windows.hasMoreElements()) {
            Qts.remove(windows.getNext());
        }
    },

    uninstall: function() {
        Services.prefs.deleteBranch("extensions.qts@moongiraffe.net.");
    },

    add: function(window) {
        let document = window.document;

        let context = document.getElementById("contentAreaContextMenu");

        if (!context) return;

        context.addEventListener("popupshowing", Qts.toggle, false);

        let reference = document.getElementById("context-searchselect");

        let item = document.createElement("menuitem");

        item.setAttribute("id", "context-qts-item");

        item.addEventListener("command", Qts.search, false);

        reference.parentNode.insertBefore(item, reference.nextSibling);

        let menu = document.createElement("menu");

        menu.setAttribute("id", "context-qts-menu");

        let popup = document.createElement("menupopup");

        popup.setAttribute("id", "context-qts-popup");

        menu.appendChild(popup);

        for (let i = 0; i < Qts.sites.length; i++) {
            // Skip Demonoid, BT Junkie and Torrent downloads.
            if (i == 1 || i == 2 || i == 8) continue;

            item = document.createElement("menuitem");

            item.setAttribute("id", "context-qts-" + i);

            item.setAttribute("label", Qts.sites[i].name);

            item.addEventListener("command", Qts.search, false);

            popup.appendChild(item);
        }

        reference.parentNode.insertBefore(menu, reference.nextSibling);
    },

    remove: function(window) {
        let context = window.document.getElementById("contentAreaContextMenu");

        context.removeEventListener("popupshowing", Qts.toggle, false);

        let children = context.childNodes;

        for (let i = children.length - 1; i >= 0; i--) {
            if (children[i].id.indexOf("context-qts") == 0)
                context.removeChild(children[i]);
        }
    },

    toggle: function(event) {
        let window = event.view;

        let document = window.document;

        let menu = document.getElementById("context-qts-menu");

        menu.setAttribute("hidden", true);

        let item = document.getElementById("context-qts-item");

        item.setAttribute("hidden", true);

        let selection = Qts.selected(window);

        if (selection.length == 0) return;

        if (selection.length > 15) { // truncate long strings
            selection = selection.slice(0, 15) + "...";
        }

        let index = Qts.preference("index");

        if (index == -1) {
            menu.setAttribute("label", "Search for \"" + selection + "\" torrents at");

            menu.setAttribute("hidden", false);
        }
        else {
            let name = "";

            if (index == -2)
                name = Qts.preference("customName");
            else
                name = Qts.sites[index].name;

            item.setAttribute("label", "Search " + name + " for \"" + selection + "\"");

            item.setAttribute("hidden", false);
        }
    },

    search: function(event) {
        let window = event.view;

        let index = Qts.preference("index");

        let uri = "";

        if (index == -2) {
            uri = Qts.preference("customURL");
        }
        else {
            if (index == -1)
                index = parseInt(event.target.id.replace(/context-qts-/, ""));

            uri = Qts.sites[index].uri;
        }

        let selection = Qts.selected(window);

        selection = encodeURI(selection);

        uri = uri.replace(/%s/, selection);

        let browser = window.getBrowser();

        let tab = browser.addTab(uri);

        let opennext = Qts.preference("next");

        if (opennext) {
            let position = browser.tabContainer.selectedIndex;

            browser.moveTabTo(tab, position + 1);
        }

        let switchtab = Qts.preference("switch");

        if (switchtab) {
            browser.selectedTab = tab;
        }
    },

    selected: function(window) {
        let selection = window
            .document
            .commandDispatcher
            .focusedWindow
            .getSelection()
            .toString();

        return selection.replace(/(\n|\r|\t)+/g, " ").trim();
    },

    preference: function(key) {
        let branch = Services.prefs.getBranch("extensions.qts@moongiraffe.net.");

        if (key === "index") {
            return branch.getIntPref(key);
        }
        else if (key === "customName" || key === "customURL") {
            const nsISupportsString = Components.interfaces.nsISupportsString;
            return branch.getComplexValue(key, nsISupportsString).data;
        }

        return branch.getBoolPref(key);
    },

    observe: function(subject, topic, data) {
        if (topic === "domwindowopened") {
            subject.addEventListener("load", function(event) {
                Qts.add(subject);
            }, false);
        }
    },
};

function startup(data, reason) {
    Qts.startup(data.installPath);
}

function shutdown(data, reason) {
    Qts.shutdown();
}

function install(data, reason) {
}

function uninstall(data, reason) {
    if (reason === 6 /* ADDON_UNINSTALL */) {
        Qts.uninstall();
    }
}
