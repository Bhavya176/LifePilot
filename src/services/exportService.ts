import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Expense } from '../types/expense';
import { Task } from '../types/task';
import { formatCurrency } from '../utils/formatters';

export const exportService = {
  /**
   * Export expenses as a modern, formatted PDF document with sharing
   */
  async exportExpensesToPDF(expenses: Expense[], userName: string = 'LifePilot User'): Promise<void> {
    const totalSpent = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const rowsHtml = expenses
      .map(
        (exp, idx) => `
        <tr style="border-bottom: 1px solid #E2E8F0; ${idx % 2 === 0 ? 'background-color: #F8FAFC;' : ''}">
          <td style="padding: 10px 12px; font-size: 13px; color: #1E293B; font-weight: 500;">${exp.title || 'Expense'}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #64748B;">${exp.category.toUpperCase()}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #64748B;">${exp.date}</td>
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 700; color: #EF4444; text-align: right;">${formatCurrency(exp.amount)}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>LifePilot Expense Statement</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0F172A; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4F46E5; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: 800; color: #4F46E5; margin: 0; }
          .subtitle { font-size: 12px; color: #64748B; margin-top: 4px; }
          .summary-card { background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; }
          .stat-label { font-size: 11px; font-weight: 600; color: #4F46E5; text-transform: uppercase; }
          .stat-value { font-size: 22px; font-weight: 800; color: #1E1B4B; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; border-radius: 8px; overflow: hidden; }
          th { background-color: #4F46E5; color: #FFFFFF; font-size: 12px; font-weight: 700; text-align: left; padding: 12px; text-transform: uppercase; }
          .footer { margin-top: 32px; font-size: 11px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">LifePilot Expense Report</h1>
            <p class="subtitle">Generated for ${userName} on ${dateStr}</p>
          </div>
        </div>

        <div class="summary-card">
          <div>
            <div class="stat-label">Total Transactions</div>
            <div class="stat-value">${expenses.length} Records</div>
          </div>
          <div style="text-align: right;">
            <div class="stat-label">Total Expenditure</div>
            <div class="stat-value" style="color: #DC2626;">${formatCurrency(totalSpent)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Date</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #94A3B8;">No expenses recorded.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by LifePilot — Your Firebase-Powered Personal Command Center.
        </div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Expense Report' });
    }
  },

  /**
   * Export expenses as a CSV file for Excel / Google Sheets
   */
  async exportExpensesToCSV(expenses: Expense[]): Promise<void> {
    const header = 'ID,Title,Amount,Category,Date,CreatedAt\n';
    const rows = expenses
      .map(
        (e) =>
          `"${e.id}","${(e.title || '').replace(/"/g, '""')}",${e.amount},"${e.category}","${e.date}","${e.createdAt}"`
      )
      .join('\n');

    const csvData = header + rows;
    const { uri } = await Print.printToFileAsync({
      html: `<pre style="font-family: monospace;">${csvData}</pre>`,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { dialogTitle: 'Share Expense Data' });
    }
  },

  /**
   * Export tasks as a printable PDF report
   */
  async exportTasksToPDF(tasks: Task[], userName: string = 'LifePilot User'): Promise<void> {
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const completedCount = tasks.filter((t) => t.completed).length;

    const rowsHtml = tasks
      .map(
        (t, idx) => `
        <tr style="border-bottom: 1px solid #E2E8F0; ${idx % 2 === 0 ? 'background-color: #F8FAFC;' : ''}">
          <td style="padding: 10px 12px; font-size: 13px; color: #1E293B; font-weight: 500;">
            ${t.completed ? '✅' : '⏳'} ${t.title}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; color: #64748B;">${t.priority.toUpperCase()}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #64748B;">${t.category}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #64748B;">${t.dueDate || 'N/A'}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>LifePilot Tasks Summary</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0F172A; }
          .header { border-bottom: 2px solid #4F46E5; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: 800; color: #4F46E5; margin: 0; }
          .subtitle { font-size: 12px; color: #64748B; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; border-radius: 8px; overflow: hidden; }
          th { background-color: #4F46E5; color: #FFFFFF; font-size: 12px; font-weight: 700; text-align: left; padding: 12px; text-transform: uppercase; }
          .footer { margin-top: 32px; font-size: 11px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">LifePilot Task Tracker Report</h1>
          <p class="subtitle">Generated for ${userName} on ${dateStr} • ${completedCount} of ${tasks.length} Completed</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Priority</th>
              <th>Category</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #94A3B8;">No tasks recorded.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">Generated by LifePilot.</div>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Task Report' });
    }
  },
};
