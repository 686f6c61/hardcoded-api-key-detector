/**
 * Report Generator
 *
 * @author 686f6c61
 * @repository https://github.com/686f6c61/hardcoded-api-key-detector
 * @license MIT
 *
 * Generates detailed reports in multiple formats
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class ReportGenerator {
  constructor(options = {}) {
    this.options = {
      showContext: true,
      contextLines: 2,
      groupBy: 'file',
      maxFindingsPerFile: 50,
      ...options
    };
  }

  /**
   * Sanitizes file paths by removing absolute paths and username references
   * @param {string} filePath - Absolute file path
   * @returns {string} Sanitized relative path
   * @private
   */
  sanitizeFilePath(filePath) {
    // Remove home directory patterns like /home/username/
    let sanitized = filePath.replace(/^\/home\/[^\/]+\//, './');

    // Remove other common absolute path patterns
    sanitized = sanitized.replace(/^\/Users\/[^\/]+\//, './');
    sanitized = sanitized.replace(/^C:\\Users\\[^\\]+\\/, '.\\');

    // Get relative path from current working directory
    const cwd = process.cwd();
    if (filePath.startsWith(cwd)) {
      sanitized = './' + path.relative(cwd, filePath);
    }

    return sanitized;
  }

  async generateReport(results, format = 'console', outputPath = null) {
    switch (format.toLowerCase()) {
      case 'json':
        return await this.generateJSONReport(results, outputPath);
      case 'html':
        return await this.generateHTMLReport(results, outputPath);
      case 'junit':
        return await this.generateJUnitReport(results, outputPath);
      case 'csv':
        return await this.generateCSVReport(results, outputPath);
      case 'txt':
      case 'text':
        return await this.generateTXTReport(results, outputPath);
      case 'console':
      default:
        return this.generateConsoleReport(results);
    }
  }

  generateConsoleReport(results) {
    const output = [];
    
    output.push(chalk.blue('[RESULTS] Scan Results:'));
    output.push(chalk.gray(`Files scanned: ${results.totalFiles}`));
    output.push(chalk.gray(`Files with issues: ${results.filesWithIssues}`));
    output.push('');
    
    // Summary by severity
    if (results.summary.critical > 0) {
      output.push(chalk.red(`[CRITICAL] Critical: ${results.summary.critical}`));
    }
    if (results.summary.high > 0) {
      output.push(chalk.red(`[HIGH] High: ${results.summary.high}`));
    }
    if (results.summary.medium > 0) {
      output.push(chalk.yellow(`[MEDIUM] Medium: ${results.summary.medium}`));
    }
    if (results.summary.low > 0) {
      output.push(chalk.gray(`[LOW] Low: ${results.summary.low}`));
    }
    
    output.push('');
    
    if (results.findings.length > 0) {
      // Group findings
      const groupedFindings = this.groupFindings(results.findings);
      
      for (const [group, items] of Object.entries(groupedFindings)) {
        if (this.options.groupBy === 'file') {
          output.push(chalk.white(`[FILE] ${group}`));
        } else if (this.options.groupBy === 'severity') {
          output.push(chalk.white(`[SEVERITY] ${group.toUpperCase()}`));
        } else if (this.options.groupBy === 'category') {
          output.push(chalk.white(`[CATEGORY] ${group}`));
        }
        
        items.forEach(finding => {
          const severityColor = {
            critical: chalk.red,
            high: chalk.red,
            medium: chalk.yellow,
            low: chalk.gray
          }[finding.severity] || chalk.gray;
          
          output.push(`  ${severityColor('[FOUND]')} ${finding.name} (${finding.severity})`);
          output.push(`    Line ${finding.line}: ${finding.lineContent.substring(0, 100)}${finding.lineContent.length > 100 ? '...' : ''}`);
          output.push(`    Service: ${finding.service} | Category: ${finding.category}`);
          output.push(`    ${finding.description}`);
          
          if (this.options.showContext && finding.context) {
            output.push('    Context:');
            finding.context.forEach(ctx => {
              const prefix = ctx.isTarget ? '>>>' : '   ';
              const color = ctx.isTarget ? chalk.red : chalk.gray;
              output.push(`    ${prefix} ${color(`${ctx.lineNumber}: ${ctx.content}`)}`);
            });
          }
          
          output.push('');
        });
      }
    } else {
      output.push(chalk.green('[SUCCESS] No hardcoded API keys detected!'));
    }
    
    return output.join('\n');
  }

  async generateJSONReport(results, outputPath) {
    const report = {
      metadata: {
        scanTime: results.scanTime,
        tool: 'hardcoded-api-detector',
        version: '1.0.0',
        repository: 'https://github.com/686f6c61/hardcoded-api-detector'
      },
      summary: {
        totalFiles: results.totalFiles,
        filesWithIssues: results.filesWithIssues,
        totalFindings: results.summary.critical + results.summary.high + results.summary.medium + results.summary.low,
        severityBreakdown: results.summary
      },
      findings: results.findings
    };
    
    const jsonOutput = JSON.stringify(report, null, 2);
    
    if (outputPath) {
      await fs.writeFile(outputPath, jsonOutput);
      return `[SUCCESS] JSON report saved to ${outputPath}`;
    }
    
    return jsonOutput;
  }

  async generateHTMLReport(results, outputPath) {
    const html = this.createHTMLTemplate(results);
    
    if (outputPath) {
      await fs.writeFile(outputPath, html);
      return `[SUCCESS] HTML report saved to ${outputPath}`;
    }
    
    return html;
  }

  async generateJUnitReport(results, outputPath) {
    const junitXml = this.createJUnitXML(results);
    
    if (outputPath) {
      await fs.writeFile(outputPath, junitXml);
      return `[SUCCESS] JUnit report saved to ${outputPath}`;
    }
    
    return junitXml;
  }

  async generateCSVReport(results, outputPath) {
    const csv = this.createCSV(results);

    if (outputPath) {
      await fs.writeFile(outputPath, csv);
      return `[SUCCESS] CSV report saved to ${outputPath}`;
    }

    return csv;
  }

  async generateTXTReport(results, outputPath) {
    const txt = this.createTXT(results);

    if (outputPath) {
      await fs.writeFile(outputPath, txt);
      return `[SUCCESS] TXT report saved to ${outputPath}`;
    }

    return txt;
  }

  groupFindings(findings) {
    const grouped = {};

    findings.forEach(fileResult => {
      const sanitizedPath = this.sanitizeFilePath(fileResult.file);

      if (this.options.groupBy === 'file') {
        grouped[sanitizedPath] = fileResult.findings;
      } else if (this.options.groupBy === 'severity') {
        fileResult.findings.forEach(finding => {
          if (!grouped[finding.severity]) {
            grouped[finding.severity] = [];
          }
          grouped[finding.severity].push({ ...finding, file: sanitizedPath });
        });
      } else if (this.options.groupBy === 'category') {
        fileResult.findings.forEach(finding => {
          if (!grouped[finding.category]) {
            grouped[finding.category] = [];
          }
          grouped[finding.category].push({ ...finding, file: sanitizedPath });
        });
      }
    });

    return grouped;
  }

  createHTMLTemplate(results) {
    const totalFindings = results.summary.critical + results.summary.high + results.summary.medium + results.summary.low;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hardcoded API Detector Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .critical { border-left: 4px solid #dc3545; }
        .high { border-left: 4px solid #fd7e14; }
        .medium { border-left: 4px solid #ffc107; }
        .low { border-left: 4px solid #6c757d; }
        .finding { margin-bottom: 20px; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden; }
        .finding-header { background: #e9ecef; padding: 15px; font-weight: bold; }
        .finding-details { padding: 15px; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; margin: 10px 0; }
        .context { background: #f1f3f4; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; }
        .target-line { background: #ffebee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Hardcoded API Detector Report</h1>
            <p>Generated on ${new Date(results.scanTime).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>${results.totalFiles}</h3>
                <p>Files Scanned</p>
            </div>
            <div class="summary-card">
                <h3>${results.filesWithIssues}</h3>
                <p>Files with Issues</p>
            </div>
            <div class="summary-card critical">
                <h3>${results.summary.critical}</h3>
                <p>Critical</p>
            </div>
            <div class="summary-card high">
                <h3>${results.summary.high}</h3>
                <p>High</p>
            </div>
            <div class="summary-card medium">
                <h3>${results.summary.medium}</h3>
                <p>Medium</p>
            </div>
            <div class="summary-card low">
                <h3>${results.summary.low}</h3>
                <p>Low</p>
            </div>
        </div>
        
        ${totalFindings === 0 ? '<div class="summary-card"><h3>[SUCCESS] No hardcoded API keys detected!</h3></div>' : ''}
        
        ${results.findings.map(fileResult => `
            <div class="finding">
                <div class="finding-header">
                    [FILE] ${this.sanitizeFilePath(fileResult.file)}
                </div>
                <div class="finding-details">
                    ${fileResult.findings.map(finding => `
                        <div style="margin-bottom: 20px;">
                            <h4>${finding.name} (${finding.severity})</h4>
                            <p><strong>Service:</strong> ${finding.service} | <strong>Category:</strong> ${finding.category}</p>
                            <p><strong>Description:</strong> ${finding.description}</p>
                            <div class="code">
                                Line ${finding.line}: ${finding.lineContent}
                            </div>
                            ${finding.context ? `
                                <div class="context">
                                    ${finding.context.map(ctx => `
                                        <div class="${ctx.isTarget ? 'target-line' : ''}">
                                            ${ctx.lineNumber}: ${ctx.content}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  createJUnitXML(results) {
    const totalFindings = results.summary.critical + results.summary.high + results.summary.medium + results.summary.low;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites name="hardcoded-api-detector" tests="${totalFindings}" failures="${results.summary.critical + results.summary.high}" time="0">\n`;
    
    results.findings.forEach(fileResult => {
      xml += `  <testsuite name="${fileResult.file}" tests="${fileResult.findings.length}" failures="${fileResult.findings.filter(f => f.severity === 'critical' || f.severity === 'high').length}">\n`;
      
      fileResult.findings.forEach(finding => {
        const failure = (finding.severity === 'critical' || finding.severity === 'high') ? 
          `<failure message="${finding.name} detected">
${finding.description}
File: ${finding.file}
Line: ${finding.line}
Match: ${finding.match}
</failure>` : '';
        
        xml += `    <testcase name="${finding.name}" classname="${finding.service}">\n`;
        xml += failure ? `      ${failure}\n` : '';
        xml += '    </testcase>\n';
      });
      
      xml += '  </testsuite>\n';
    });
    
    xml += '</testsuites>';
    return xml;
  }

  createCSV(results) {
    const headers = ['File', 'Line', 'Name', 'Severity', 'Service', 'Category', 'Description', 'Match', 'LineContent'];
    let csv = headers.join(',') + '\n';

    results.findings.forEach(fileResult => {
      fileResult.findings.forEach(finding => {
        const row = [
          `"${fileResult.file}"`,
          finding.line,
          `"${finding.name}"`,
          finding.severity,
          `"${finding.service}"`,
          `"${finding.category}"`,
          `"${finding.description}"`,
          `"${finding.match}"`,
          `"${finding.lineContent.replace(/"/g, '""')}"`
        ];
        csv += row.join(',') + '\n';
      });
    });

    return csv;
  }

  createTXT(results) {
    const totalFindings = results.summary.critical + results.summary.high + results.summary.medium + results.summary.low;
    let txt = '';

    // Header
    txt += '='.repeat(80) + '\n';
    txt += '  HARDCODED API DETECTOR - TEXT REPORT\n';
    txt += '='.repeat(80) + '\n\n';

    // Metadata
    txt += `Scan Time: ${new Date(results.scanTime).toLocaleString()}\n`;
    txt += `Tool: hardcoded-api-detector\n`;
    txt += `Repository: https://github.com/686f6c61/hardcoded-api-detector\n\n`;

    // Summary
    txt += '-'.repeat(80) + '\n';
    txt += 'SUMMARY\n';
    txt += '-'.repeat(80) + '\n';
    txt += `Files Scanned:      ${results.totalFiles}\n`;
    txt += `Files with Issues:  ${results.filesWithIssues}\n`;
    txt += `Total Findings:     ${totalFindings}\n\n`;
    txt += `Severity Breakdown:\n`;
    txt += `  Critical:         ${results.summary.critical}\n`;
    txt += `  High:             ${results.summary.high}\n`;
    txt += `  Medium:           ${results.summary.medium}\n`;
    txt += `  Low:              ${results.summary.low}\n\n`;

    if (totalFindings === 0) {
      txt += '-'.repeat(80) + '\n';
      txt += '[SUCCESS] No hardcoded API keys detected!\n';
      txt += '-'.repeat(80) + '\n';
      return txt;
    }

    // Findings
    txt += '-'.repeat(80) + '\n';
    txt += 'FINDINGS\n';
    txt += '-'.repeat(80) + '\n\n';
    txt += 'Format: FILE:LINE - TOKEN (CREDENTIAL_NAME) [SEVERITY]\n\n';

    results.findings.forEach(fileResult => {
      fileResult.findings.forEach(finding => {
        const severityTag = `[${finding.severity.toUpperCase()}]`;
        const sanitizedPath = this.sanitizeFilePath(fileResult.file);
        const line = `${sanitizedPath}:${finding.line}`;
        const token = finding.match || '(no match captured)';
        const name = finding.name;

        txt += `${line.padEnd(60)} - ${token}\n`;
        txt += `${' '.repeat(63)}(${name}) ${severityTag}\n`;
        txt += `${' '.repeat(63)}Service: ${finding.service}\n\n`;
      });
    });

    // Footer
    txt += '-'.repeat(80) + '\n';
    txt += `End of Report - ${totalFindings} findings detected\n`;
    txt += '-'.repeat(80) + '\n';

    return txt;
  }
}

module.exports = ReportGenerator;