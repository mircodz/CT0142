all: main

main: main.tex
	kitty -d "$$PWD" nvim main.tex & disown
	zathura main.pdf & disown
	ls "main.tex" \
		| entr -s "pdflatex -interaction nonstopmode -shell-escape -file-line-error main.tex"

clean:
	rm -rf main.aux main.log main.toc main.out _minted-main
