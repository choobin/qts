ZIP=$(shell which zip)

all: clean
	$(ZIP) qts-chrome.zip background.html ChangeLog icon16.png icon48.png icon128.png manifest.json options.html options.js qts.js torrent_sites.js ../LICENSE ../README

clean:
	$(RM) qts-chrome.zip

.PHONY: all clean
