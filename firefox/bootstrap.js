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

let moongiraffe = {};

moongiraffe.Qts  = {
    sites: [
        { name: "The Pirate Bay",    uri: "http://thepiratebay.se/search/%s/0/99/0" },
        { name: "Demonoid",          uri: "http://www.demonoid.me/files/?query=%s" }, // Keep this.
        { name: "BT Junkie",         uri: "http://btjunkie.org/search?q=%s" }, // Keep this. Do not fuck with older qts.index preference values.
        { name: "Torrentz",          uri: "http://torrentz.eu/any?q=%s" },
        { name: "Kickass Torrents",  uri: "http://www.kat.ph/search/%s/" },
        { name: "ISO Hunt",          uri: "http://isohunt.com/torrents/?ihq=%s" },
        { name: "Bitsnoop",          uri: "http://bitsnoop.com/search/all/%s/c/d/1" },
        { name: "Extra Torrent",     uri: "http://extratorrent.com/search/?search=%s" },
        { name: "Torrent Downloads", uri: "http://www.torrentdownloads.net/search/?search=%s" },
        { name: "Torrent Reactor",   uri: "http://www.torrentreactor.net/torrent-search/%s" },
        { name: "Lime Torrents",     uri: "http://www.limetorrents.com/search/all/%s/" },
    ],

    startup: function(installPath) {
        let branch = Services.prefs.getDefaultBranch("extensions.qts@moongiraffe.net.");

        branch.setIntPref("index", 0);

        branch.setBoolPref("switch", true);

        branch.setBoolPref("next", false);

        let resource = Services.io
            .getProtocolHandler("resource")
            .QueryInterface(Components.interfaces.nsIResProtocolHandler);

        let alias = Services.io.newFileURI(installPath);

        if (!installPath.isDirectory()) {
            alias = Services.io.newURI("jar:" + alias.spec + "!/", null, null);
        }

        resource.setSubstitution("qts", alias);

        Services.ww.registerNotification(moongiraffe.Qts);

        let windows = Services.wm.getEnumerator("navigator:browser");

        while (windows.hasMoreElements()) {
            moongiraffe.Qts.add(windows.getNext());
        }
    },

    shutdown: function() {
        let resource = Services.io
            .getProtocolHandler("resource")
            .QueryInterface(Components.interfaces.nsIResProtocolHandler);

        resource.setSubstitution("qts", null);

        Services.ww.unregisterNotification(moongiraffe.Qts);

        let windows = Services.wm.getEnumerator("navigator:browser");

        while (windows.hasMoreElements()) {
            moongiraffe.Qts.remove(windows.getNext());
        }
    },

    uninstall: function() {
        Services.prefs.deleteBranch("extensions.qts@moongiraffe.net.");
    },

    add: function(window) {
        let context = window.document.getElementById("contentAreaContextMenu");

        if (!context) {
            return;
        }

        context.addEventListener("popupshowing", moongiraffe.Qts.update, false);

        let item = window.document.createElement("menuitem");

        item.setAttribute("id", "context-qts");

        item.addEventListener("click", moongiraffe.Qts.search, false);

        let reference = window.document.getElementById("context-searchselect");

        reference.parentNode.insertBefore(item, reference.nextSibling);
    },

    remove: function(window) {
        let context = window.document.getElementById("contentAreaContextMenu");

        context.removeEventListener("popupshowing", moongiraffe.Qts.update, false);

        let item = window.document.getElementById("context-qts");

        item.parentNode.removeChild(item);
    },

    update: function(event) {
        let window = event.view;

        let context = window.document.getElementById("contentAreaContextMenu");

        let item = window.document.getElementById("context-qts");

        item.hidden = true;

        let selection = moongiraffe.Qts.selected(window);

        if (selection.length === 0) {
            return;
        }

        if (selection.length > 15) { // truncate long strings
            selection = selection.slice(0, 15) + "...";
        }

        let index = moongiraffe.Qts.preference("index");

        let name = moongiraffe.Qts.sites[index].name;

        item.label = "Search " + name + " for \"" + selection + "\"";

        item.hidden = false;
    },

    search: function(event) {
        let window = event.view;

        let index = moongiraffe.Qts.preference("index");

        let uri = moongiraffe.Qts.sites[index].uri;

        let selection = moongiraffe.Qts.selected(window);

        selection = encodeURI(selection);

        uri = uri.replace(/%s/, selection);

        let browser = window.getBrowser();

        let tab = browser.addTab(uri);

        let opennext = moongiraffe.Qts.preference("next");

        if (opennext) {
            let position = browser.tabContainer.selectedIndex;

            browser.moveTabTo(tab, position + 1);
        }

        let switchtab = moongiraffe.Qts.preference("switch");

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

        return branch.getBoolPref(key);
    },

    observe: function(subject, topic, data) {
        if (topic === "domwindowopened") {
            subject.addEventListener("load", function(event) {
                moongiraffe.Qts.add(subject);
            }, false);
        }
    },
};

function startup(data, reason) {
    moongiraffe.Qts.startup(data.installPath);
}

function shutdown(data, reason) {
    moongiraffe.Qts.shutdown();
}

function install(data, reason) {
}

function uninstall(data, reason) {
    if (reason === 6 /* ADDON_UNINSTALL */) {
        moongiraffe.Qts.uninstall();
    }
}