import chalk from "chalk";
import gradient from "gradient-string";
import boxen from "boxen";
import { table } from "table";

export class QuotaVisualizer {
  constructor(options = {}) {
    this.options = {
      colors: options.colors !== false,
      asciiBars: options.asciiBars !== false,
      compact: options.compact || false,
      ...options
    };
  }

  getColorForPercent(percent) {
    if (percent === null || percent === undefined) return chalk.gray;
    if (percent <= 0) return chalk.red;
    if (percent <= 20) return chalk.yellow;
    if (percent <= 50) return chalk.cyan;
    return chalk.green;
  }

  getStatusIcon(status) {
    switch (status) {
      case "OK": return chalk.green("✓");
      case "LOW": return chalk.yellow("⚠");
      case "LIMITED": return chalk.red("✗");
      default: return chalk.gray("?");
    }
  }

  createProgressBar(percent, width = 20) {
    if (!this.options.asciiBars) {
      return `${percent}%`;
    }

    const filled = Math.round((percent || 0) * width / 100);
    const empty = width - filled;
    
    const color = this.getColorForPercent(percent);
    const bar = color("█".repeat(filled)) + chalk.gray("░".repeat(empty));
    
    return bar;
  }

  formatAccountHeader(account) {
    const title = gradient.atlas(`Account ${account.index}: ${account.email}`);
    const status = account.enabled 
      ? chalk.green("ENABLED") 
      : chalk.red("DISABLED");
    
    const project = chalk.blue(`Project: ${account.projectId || "N/A"}`);
    
    return boxen(
      `${title}\n${status} • ${project}`,
      { 
        padding: 1,
        borderStyle: account.enabled ? "round" : "classic",
        borderColor: account.enabled ? "blue" : "gray"
      }
    );
  }

  formatResetTime(resetTime) {
    if (!resetTime) return chalk.gray("N/A");
    
    const resetDate = new Date(resetTime);
    const now = new Date();
    const diffMs = resetDate - now;
    
    if (diffMs <= 0) return chalk.green("NOW");
    
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      const remainingHours = diffHours % 24;
      return chalk.yellow(`${days}d${remainingHours > 0 ? ` ${remainingHours}h` : ''}`);
    } else if (diffHours > 0) {
      const diffMinutes = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return chalk.cyan(`${diffHours}h${diffMinutes > 0 ? ` ${diffMinutes}m` : ''}`);
    } else {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      const diffSeconds = Math.round((diffMs % (1000 * 60)) / 1000);
      return chalk.blue(`${diffMinutes}m${diffSeconds > 0 ? ` ${diffSeconds}s` : ''}`);
    }
  }

  formatModelRow(modelName, data) {
    const icon = this.getStatusIcon(data.status);
    const percent = data.remainingPercent !== null ? `${data.remainingPercent}%` : "N/A";
    const bar = this.createProgressBar(data.remainingPercent);
    const resetInfo = this.formatResetTime(data.resetTime);

    const modelLabel = chalk.bold(`${modelName}:`);
    
    return `${icon} ${modelLabel.padEnd(15)} ${bar} ${chalk.bold(percent.padStart(4))} ${chalk.gray(`(${resetInfo})`)}`;
  }

  displayAccount(account) {
    if (!account.enabled) {
      console.log(chalk.gray(`\nAccount ${account.index}: ${account.email} (DISABLED)`));
      return;
    }

    console.log(`\n${this.formatAccountHeader(account)}`);

    if (account.error) {
      console.log(chalk.red(`  Error: ${account.error}`));
      return;
    }

    const models = [
      { name: "Claude", data: account.groups.claude },
      { name: "Gemini 3 Pro", data: account.groups.geminiPro },
      { name: "Gemini 3 Flash", data: account.groups.geminiFlash }
    ];

    for (const model of models) {
      console.log(`  ${this.formatModelRow(model.name, model.data)}`);
    }
  }

  displayTable(results) {
    const tableData = [
      [
        chalk.bold("Account"),
        chalk.bold("Status"),
        chalk.bold("Claude"),
        chalk.bold("Reset"),
        chalk.bold("Gemini Pro"),
        chalk.bold("Reset"),
        chalk.bold("Gemini Flash"),
        chalk.bold("Reset"),
        chalk.bold("Project")
      ]
    ];

    for (const account of results) {
      const accountName = account.email || `Account ${account.index}`;
      const status = account.enabled 
        ? chalk.green("ENABLED") 
        : chalk.red("DISABLED");
      
      // Claude
      const claudePercent = account.groups?.claude?.remainingPercent !== null && account.groups?.claude?.remainingPercent !== undefined
        ? `${account.groups.claude.remainingPercent}%`
        : "N/A";
      const claudeStatus = account.groups?.claude?.status 
        ? this.getStatusIcon(account.groups.claude.status) + " " + claudePercent
        : "N/A";
      const claudeReset = this.formatResetTime(account.groups?.claude?.resetTime);
      
      // Gemini Pro
      const geminiProPercent = account.groups?.geminiPro?.remainingPercent !== null && account.groups?.geminiPro?.remainingPercent !== undefined
        ? `${account.groups.geminiPro.remainingPercent}%`
        : "N/A";
      const geminiProStatus = account.groups?.geminiPro?.status 
        ? this.getStatusIcon(account.groups.geminiPro.status) + " " + geminiProPercent
        : "N/A";
      const geminiProReset = this.formatResetTime(account.groups?.geminiPro?.resetTime);
      
      // Gemini Flash
      const geminiFlashPercent = account.groups?.geminiFlash?.remainingPercent !== null && account.groups?.geminiFlash?.remainingPercent !== undefined
        ? `${account.groups.geminiFlash.remainingPercent}%`
        : "N/A";
      const geminiFlashStatus = account.groups?.geminiFlash?.status 
        ? this.getStatusIcon(account.groups.geminiFlash.status) + " " + geminiFlashPercent
        : "N/A";
      const geminiFlashReset = this.formatResetTime(account.groups?.geminiFlash?.resetTime);

      const project = account.projectId 
        ? account.projectId.substring(0, 15) + (account.projectId.length > 15 ? "..." : "")
        : "N/A";

      tableData.push([
        accountName,
        status,
        claudeStatus,
        claudeReset,
        geminiProStatus,
        geminiProReset,
        geminiFlashStatus,
        geminiFlashReset,
        project
      ]);
    }

    const tableConfig = {
      border: {
        topBody: `─`,
        topJoin: `┬`,
        topLeft: `┌`,
        topRight: `┐`,

        bottomBody: `─`,
        bottomJoin: `┴`,
        bottomLeft: `└`,
        bottomRight: `┘`,

        bodyLeft: `│`,
        bodyRight: `│`,
        bodyJoin: `│`,

        joinBody: `─`,
        joinLeft: `├`,
        joinRight: `┤`,
        joinJoin: `┼`
      },
      drawHorizontalLine: (index, size) => {
        return index === 0 || index === 1 || index === size;
      }
    };

    console.log(table(tableData, tableConfig));
  }

  displaySummary(summary) {
    console.log(chalk.bold("\n📊 SUMMARY"));
    console.log(chalk.gray("═".repeat(50)));
    
    console.log(`Accounts: ${chalk.bold(summary.totalAccounts)} total`);
    console.log(`  ${chalk.green(`✓ ${summary.enabledAccounts} enabled`)}`);
    console.log(`  ${chalk.gray(`○ ${summary.disabledAccounts} disabled`)}`);
    console.log(`  ${chalk.red(`✗ ${summary.errorAccounts} with errors`)}`);
    
    console.log(chalk.gray("\nModel Status:"));
    
    const models = [
      { name: "Claude", data: summary.models.claude },
      { name: "Gemini 3 Pro", data: summary.models.geminiPro },
      { name: "Gemini 3 Flash", data: summary.models.geminiFlash }
    ];
    
    for (const model of models) {
      const total = model.data.ok + model.data.low + model.data.limited + model.data.unknown;
      if (total === 0) continue;
      
      const parts = [];
      if (model.data.ok > 0) parts.push(chalk.green(`${model.data.ok} OK`));
      if (model.data.low > 0) parts.push(chalk.yellow(`${model.data.low} LOW`));
      if (model.data.limited > 0) parts.push(chalk.red(`${model.data.limited} LIMITED`));
      if (model.data.unknown > 0) parts.push(chalk.gray(`${model.data.unknown} UNKNOWN`));
      
      console.log(`  ${chalk.bold(model.name)}: ${parts.join(", ")}`);
    }
  }

  displayWelcome() {
    const title = gradient.pastel.multiline(`
╔══════════════════════════════════════════════════╗
║      ANTIGRAVITY QUOTA MONITOR v1.0.0            ║
║      Monitor your OpenCode API quotas            ║
╚══════════════════════════════════════════════════╝
    `);
    
    console.log(title);
    console.log(chalk.gray("Checking accounts...\n"));
  }

  displayError(error) {
    console.log(chalk.red("\n❌ ERROR"));
    console.log(chalk.gray("═".repeat(50)));
    console.log(chalk.red(error));
    
    console.log(chalk.gray("\nTroubleshooting:"));
    console.log("1. Make sure OpenCode is installed");
    console.log("2. Verify you have Antigravity accounts configured");
    console.log("3. Check if antigravity-accounts.json exists");
    console.log("4. Ensure you have internet connection");
  }

  displayNoAccounts() {
    console.log(chalk.yellow("\n⚠️  NO ACCOUNTS FOUND"));
    console.log(chalk.gray("═".repeat(50)));
    console.log("No Antigravity accounts found in:");
    console.log(chalk.cyan("%APPDATA%\\opencode\\antigravity-accounts.json"));
    console.log(chalk.gray("\nTo add accounts:"));
    console.log("1. Run: opencode auth login");
    console.log("2. Select Google provider");
    console.log("3. Follow the OAuth flow");
  }
}

export default QuotaVisualizer;