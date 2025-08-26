package main

import (
	"fmt"
	"os"

	"github.com/urfave/cli/v2"
)

func main() {
	app := &cli.App{
		Name:  "path-printer",
		Usage: "Print a provided path",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:     "path",
				Aliases:  []string{"p"},
				Usage:    "Path to print",
				Required: true,
			},
		},
		Action: func(c *cli.Context) error {
			fmt.Println("Path:", c.String("path"))
			return nil
		},
	}

	err := app.Run(os.Args)
	if err != nil {
		fmt.Println("Error:", err)
		os.Exit(1)
	}
}
