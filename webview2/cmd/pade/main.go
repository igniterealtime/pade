package main

import (
	"log"

	"github.com/jchv/go-webview2"
)

func main() {
	debug := false
	w := webview2.New(debug)
	if w == nil {
		log.Fatalln("Failed to load webview.")
	}
	defer w.Destroy();
	w.SetTitle("Pade Converse | 2.1.5");
	w.SetSize(1500, 900, webview2.HintFixed);
	w.Navigate("https://igniterealtime.github.io/pade/");
	w.Run();
}
