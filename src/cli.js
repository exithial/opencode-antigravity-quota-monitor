#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import ora from "ora";
import { ConfigService } from "./services/config.service.js";
import QuotaChecker from "./quota-checker.js";
import QuotaVisualizer from "./visualizer.js";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

program
  .name("antigravity-quota")
  .description("Monitor Antigravity API quotas for OpenCode")
  .version("1.0.0")
  .option("-a, --account <number>", "Check specific account (1, 2, 3...)")
  .option("-w, --watch", "Watch mode (auto-refresh every 60s)")
  .option("-i, --interval <seconds>", "Refresh interval in seconds (default: 60)", "60")
  .option("-v, --verbose", "Verbose output")
  .option("-q, --quiet", "Quiet mode (minimal output)")
  .option("-j, --json", "Output as JSON")
  .option("-c, --csv", "Output as CSV")
  .option("-t, --table", "Display as table (CLI mode)")
  .option("--cli", "Use CLI mode instead of TUI")
  .option("--tui", "Start TUI interface (default)")
  .option("--export <format>", "Export to file (json, csv)")
  .option("--history", "Show history of quota usage")
  .option("--force", "Force refresh (bypass cache)")
  .option("--config <path>", "Path to config file")
  .option("--accounts-path <path>", "Path to antigravity-accounts.json");

program.parse(process.argv);
const options = program.opts();

async function main() {
  // Inicializar configuración al inicio
  try {
    ConfigService.initialize();
  } catch (error) {
    console.error(chalk.red("❌ Error de configuración:"), error.message);
    console.log(chalk.yellow("\n💡 Posible solución:"));
    console.log("  El sistema intentó generar un archivo .env automáticamente pero falló.");
    console.log("  Verifica que tengas permisos de escritura en el directorio actual.");
    process.exit(1);
  }

  // Determinar modo de operación
  const useTUI = !options.table && !options.cli && !options.json && !options.csv && !options.watch && !options.account;
  
  // Si se solicita TUI explícitamente o es el modo por defecto
  if (options.tui || useTUI) {
    try {
      const { startMinimalTUI } = await import("./tui-minimal.js");
      await startMinimalTUI();
      return;
    } catch (error) {
      console.error(chalk.red("Failed to start TUI:"), error.message);
      process.exit(1);
    }
  }

  const visualizer = new QuotaVisualizer({
    colors: !options.json && !options.csv,
    asciiBars: !options.table,
    compact: options.quiet
  });

  const checker = new QuotaChecker({
    accountsPath: options.accountsPath,
    verbose: options.verbose,
    force: options.force
  });

  // Mostrar banner de bienvenida
  if (!options.quiet && !options.json && !options.csv) {
    visualizer.displayWelcome();
  }

  // Función para ejecutar la verificación
  async function runCheck() {
    const spinner = !options.quiet && !options.json && !options.csv 
      ? ora("Checking quotas...").start() 
      : null;

    try {
      const result = await checker.checkAllAccounts(
        options.account ? parseInt(options.account) - 1 : null
      );

      if (spinner) spinner.succeed("Quotas checked successfully!");

      if (!result.success) {
        visualizer.displayError(result.error);
        process.exit(1);
      }

      if (result.checkedAccounts === 0) {
        visualizer.displayNoAccounts();
        process.exit(0);
      }

      // Exportar si se solicita
      if (options.export || options.json || options.csv) {
        exportResults(result.results, options.export || (options.json ? "json" : "csv"));
        return;
      }

      // Mostrar resultados
      if (options.table) {
        visualizer.displayTable(result.results);
      } else {
        for (const account of result.results) {
          visualizer.displayAccount(account);
        }
      }

      // Mostrar resumen
      if (!options.quiet && result.results.length > 1) {
        const summary = checker.getSummary(result.results);
        visualizer.displaySummary(summary);
      }

      // Guardar historial si está habilitado
      if (options.history || existsSync(join(process.cwd(), "data"))) {
        saveHistory(result.results);
      }

    } catch (error) {
      if (spinner) spinner.fail("Failed to check quotas");
      visualizer.displayError(error.message);
      process.exit(1);
    }
  }

  // Modo watch
  if (options.watch) {
    const interval = parseInt(options.interval) * 1000;
    console.log(chalk.blue(`\n🔍 Watch mode enabled (refreshing every ${options.interval}s)`));
    console.log(chalk.gray("Press Ctrl+C to stop\n"));

    await runCheck();
    
    setInterval(async () => {
      console.log(chalk.gray(`\n⏰ Refreshing at ${new Date().toLocaleTimeString()}...`));
      await runCheck();
    }, interval);

    // Manejar Ctrl+C
    process.on("SIGINT", () => {
      console.log(chalk.yellow("\n\n👋 Stopping watch mode..."));
      process.exit(0);
    });

  } else {
    // Ejecución única
    await runCheck();
  }
}

function exportResults(results, format) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `quota-export-${timestamp}.${format}`;
  
  let content;
  if (format === "json") {
    content = JSON.stringify({
      timestamp: new Date().toISOString(),
      accounts: results
    }, null, 2);
  } else if (format === "csv") {
    const headers = ["Account", "Email", "Status", "Claude%", "Gemini Pro%", "Gemini Flash%", "Project", "Error"];
    const rows = results.map(account => [
      account.index,
      account.email,
      account.enabled ? "ENABLED" : "DISABLED",
      account.groups?.claude?.remainingPercent ?? "N/A",
      account.groups?.geminiPro?.remainingPercent ?? "N/A",
      account.groups?.geminiFlash?.remainingPercent ?? "N/A",
      account.projectId ?? "N/A",
      account.error ?? ""
    ]);
    
    content = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
  }

  // Crear directorio data si no existe
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const filepath = join(dataDir, filename);
  writeFileSync(filepath, content);
  
  console.log(chalk.green(`\n✅ Exported to: ${filepath}`));
}

function saveHistory(results) {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const historyFile = join(dataDir, "history.json");
  let history = [];
  
  if (existsSync(historyFile)) {
    try {
      history = JSON.parse(readFileSync(historyFile, "utf8"));
    } catch (error) {
      history = [];
    }
  }

  const entry = {
    timestamp: new Date().toISOString(),
    accounts: results.map(account => ({
      index: account.index,
      email: account.email,
      enabled: account.enabled,
      groups: account.groups,
      error: account.error
    }))
  };

  history.push(entry);
  
  // Mantener solo últimos 1000 registros
  if (history.length > 1000) {
    history = history.slice(-1000);
  }

  writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

// Manejar errores no capturados
process.on("unhandledRejection", (error) => {
  console.error(chalk.red("\n❌ Unhandled rejection:"), error.message);
  process.exit(1);
});

// Ejecutar aplicación
main().catch(error => {
  console.error(chalk.red("\n❌ Fatal error:"), error.message);
  process.exit(1);
});