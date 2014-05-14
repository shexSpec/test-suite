compress:
	tar -cf tests.tar tests
	gzip -f tests.tar
	zip tests.zip tests/*