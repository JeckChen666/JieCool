package main

import (
	_ "github.com/gogf/gf/contrib/drivers/pgsql/v2"
	_ "server/internal/packed"

	"github.com/gogf/gf/v2/os/gctx"

	"server/internal/cmd"
)

func main() {
	cmd.Main.Run(gctx.GetInitCtx())
}
