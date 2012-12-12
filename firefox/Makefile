ZIP=$(shell which zip)

all: clean
	$(ZIP) qts@moongiraffe.net.xpi bootstrap.js ChangeLog icon.png install.rdf options.xul ../LICENSE ../README

clean:
	$(RM) qts@moongiraffe.net.xpi

.PHONY: all clean
