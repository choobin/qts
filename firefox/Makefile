ZIP=$(shell which zip)

XPI=qts@moongiraffe.net.xpi

all: clean zip

install: zip
	firefox $(XPI) &

zip:
	$(ZIP) $(XPI) bootstrap.js ChangeLog icon.png install.rdf options.xul ../LICENSE ../README

clean:
	$(RM) $(XPI)

.PHONY: all clean
