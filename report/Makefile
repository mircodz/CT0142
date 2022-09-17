FILENAME=main


view: 
	zathura $(FILEAME).pdf & disown

edit:
	kitty -d "$$PWD" nvim $(FILEAME).tex & disown

update: $(FILEAME).tex
	ls "$(FILEAME).tex" \
		| entr -s "pdflatex -interaction nonstopmode -shell-escape -file-line-error $(FILEAME).tex"

all: view edit update

clean:
	rm -rf $(FILEAME).aux $(FILEAME).log $(FILEAME).toc $(FILEAME).out _minted-$(FILEAME)
