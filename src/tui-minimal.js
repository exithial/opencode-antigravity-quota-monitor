#!/usr/bin/env node

import readline from "node:readline";
import chalk from "chalk";
import gradient from "gradient-string";
import ora from "ora";
import QuotaChecker from "./quota-checker.js";
import QuotaVisualizer from "./visualizer.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function displayMenu() {
  console.log(gradient.pastel(`
╔══════════════════════════════════════════════════════╗
║         ANTIGRAVITY QUOTA MONITOR - TUI              ║
║         Interactive Quota Management                 ║
╚══════════════════════════════════════════════════════╝
  `));
  
  console.log(chalk.cyan("\nMENU PRINCIPAL"));
  console.log(chalk.gray("══════════════════════════════════════════"));
  console.log("1. 📊 Check all quotas");
  console.log("2. 👤 Check specific account");
  console.log("3. 🔄 Auto-refresh mode");
  console.log("4. 💾 Export data");
  console.log("5. ❌ Exit");
  console.log(chalk.gray("══════════════════════════════════════════"));
}

async function checkQuotas(checker) {
  const spinner = ora("Checking quotas...").start();
  try {
    const result = await checker.checkAllAccounts();
    spinner.succeed("Quotas checked!");
    
    if (!result.success) {
      console.log(chalk.red(`\nError: ${result.error}`));
      return null;
    }
    
    return result.results;
  } catch (error) {
    spinner.fail("Failed to check quotas");
    console.log(chalk.red(`\nError: ${error.message}`));
    return null;
  }
}

async function startMinimalTUI() {
  const checker = new QuotaChecker();
  const visualizer = new QuotaVisualizer();

  while (true) {
    console.clear();
    displayMenu();
    
    const choice = await prompt(chalk.yellow("\nSelect option (1-5): "));
    
    if (choice === "5" || choice.toLowerCase() === "exit") {
      console.log(chalk.green("\n👋 Goodbye!"));
      rl.close();
      process.exit(0);
    }

    if (choice === "1") {
      console.clear();
      console.log(chalk.blue("📊 Checking all accounts...\n"));
      
      const results = await checkQuotas(checker);
      if (results) {
        visualizer.displayTable(results);
        const summary = checker.getSummary(results);
        visualizer.displaySummary(summary);
      }
      
      await prompt(chalk.gray("\nPress Enter to continue..."));
    }

    if (choice === "2") {
      console.clear();
      const results = await checkQuotas(checker);
      if (!results) {
        await prompt(chalk.gray("\nPress Enter to continue..."));
        continue;
      }

      console.log(chalk.cyan("\nSELECT ACCOUNT"));
      console.log(chalk.gray("══════════════════════════════════════════"));
      results.forEach((account, index) => {
        const status = account.enabled ? chalk.green("✓") : chalk.red("✗");
        console.log(`${index + 1}. ${status} ${account.email || `Account ${account.index}`}`);
      });
      console.log(chalk.gray("══════════════════════════════════════════"));

      const accountChoice = await prompt(chalk.yellow("\nSelect account (1-" + results.length + "): "));
      const accountIndex = parseInt(accountChoice) - 1;
      
      if (accountIndex >= 0 && accountIndex < results.length) {
        console.clear();
        visualizer.displayAccount(results[accountIndex]);
      } else {
        console.log(chalk.red("Invalid account selection"));
      }
      
      await prompt(chalk.gray("\nPress Enter to continue..."));
    }

    if (choice === "3") {
      console.clear();
      console.log(chalk.blue("🔄 Auto-refresh mode\n"));
      console.log(chalk.gray("Press Ctrl+C to stop\n"));

      let refreshCount = 0;
      const refreshInterval = 60; // segundos
      let shouldStop = false;

      const stopHandler = () => {
        shouldStop = true;
        console.log(chalk.yellow("\n\n👋 Stopping auto-refresh mode..."));
        rl.close();
        process.exit(0);
      };

      process.on("SIGINT", stopHandler);

      while (!shouldStop) {
        refreshCount++;
        console.log(chalk.gray(`\n⏰ Refresh #${refreshCount} at ${new Date().toLocaleTimeString()}`));
        
        const results = await checkQuotas(checker);
        if (results) {
          console.clear();
          visualizer.displayTable(results);
          console.log(chalk.gray(`\nNext refresh in ${refreshInterval}s • Press Ctrl+C to stop`));
        }

        // Esperar el intervalo
        await new Promise(resolve => setTimeout(resolve, refreshInterval * 1000));
      }
    }

    if (choice === "4") {
      console.clear();
      console.log(chalk.blue("💾 Export Data\n"));
      
      const results = await checkQuotas(checker);
      if (!results) {
        await prompt(chalk.gray("\nPress Enter to continue..."));
        continue;
      }

      console.log("1. JSON format");
      console.log("2. CSV format");
      const formatChoice = await prompt(chalk.yellow("\nSelect format (1-2): "));
      
      const format = formatChoice === "1" ? "json" : "csv";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `quota-export-${timestamp}.${format}`;
      
      // Crear directorio data si no existe
      const fs = await import("node:fs");
      const path = await import("node:path");
      
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      let content;
      if (format === "json") {
        content = JSON.stringify({
          timestamp: new Date().toISOString(),
          accounts: results
        }, null, 2);
      } else {
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

      const filepath = path.join(dataDir, filename);
      fs.writeFileSync(filepath, content);
      
      console.log(chalk.green(`\n✅ Exported to: ${filepath}`));
      await prompt(chalk.gray("\nPress Enter to continue..."));
    }
  }
}

// Manejar Ctrl+C
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n👋 Goodbye!"));
  rl.close();
  process.exit(0);
});

// Exportar la función para uso desde CLI
export { startMinimalTUI };

// Si se ejecuta directamente, iniciar TUI
if (import.meta.url === `file://${process.argv[1]}`) {
  startMinimalTUI().catch(error => {
    console.error(chalk.red("Fatal error:"), error.message);
    rl.close();
    process.exit(1);
  });
}