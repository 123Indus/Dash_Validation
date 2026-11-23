import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const reportDir=path.join(process.cwd(), 'reports');
const screenshotDir=path.join(
        process.cwd(),
        'screenshots',
        'dash-violations'
);

/*const excelPath=path.join(reportDir,{recursive:true});
const textPath=path.join(screenshotDir,{recursive:true});*/

const excelPath = path.join(reportDir, 'dash-violations.xlsx');
const excelLockPath = `${excelPath}.lock`;
const textPath = path.join(screenshotDir, 'dash-violations.txt');

async function withExcelLock(action) {
    const timeoutAt = Date.now() + 60_000;
    let lockHandle;

    while (lockHandle === undefined) {
        try {
            lockHandle = fs.openSync(excelLockPath, 'wx');
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }

            try {
                if (Date.now() - fs.statSync(excelLockPath).mtimeMs > 5 * 60_000) {
                    fs.unlinkSync(excelLockPath);
                    continue;
                }
            } catch (statError) {
                if (statError.code !== 'ENOENT') {
                    throw statError;
                }
            }

            if (Date.now() >= timeoutAt) {
                throw new Error(`Timed out waiting for Excel report lock: ${excelLockPath}`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    try {
        await action();
    } finally {
        fs.closeSync(lockHandle);
        fs.unlinkSync(excelLockPath);
    }
}

export async function initializeReports() {
   fs.mkdirSync(reportDir, { recursive: true });
   fs.mkdirSync(screenshotDir, { recursive: true });

    /*fs.mkdir(reportDir,"dash-violations.xlsx")
    fs.mkdirSync(screenshotDir,"dash-violations.txt")*/

    //create a fresh excel report
    const workbook=new ExcelJS.Workbook();
    const worksheet=workbook.addWorksheet('Dash Violations');
       worksheet.columns = [
        { header: 'SL No', key: 'slNo', width: 10 },
        { header: 'Test Scenario', key: 'scenario', width: 30 },
        { header: 'Page URL', key: 'url', width: 40 },
        { header: 'Violation Type', key: 'type', width: 22 },
        { header: 'Actual Text', key: 'text', width: 55 },
        { header: 'Selector', key: 'selector', width: 25 },
        { header: 'Screenshot', key: 'screenshot', width: 55 },
        { header: 'Timestamp', key: 'timestamp', width: 25 }
    ];

    worksheet.getRow(1).font = { bold: true };
    await workbook.xlsx.writeFile(excelPath);

    //create a fresh test report
    fs.writeFileSync(textPath, 'SIDE WIDE DASH VALIDATION REPORT\n\n', { flag: 'w' });
}


export async function recordViolations(page, scenario, violations) {

    if (!violations.length) {
        return;
    }

    // Capture screenshot for the failed scenario
    const screenshotName = `${scenario.replace(/\s+/g, '_')}_${Date.now()}.png`;
    const screenshotPath = path.join(screenshotDir, screenshotName);

    await page.screenshot({
        path: screenshotPath,
        fullPage: true
    });

    const timestamp = new Date().toLocaleString();

    await withExcelLock(async () => {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);

        const worksheet = workbook.getWorksheet('Dash Violations');
        if (!worksheet) {
            throw new Error('Dash Violations worksheet is missing from the Excel report.');
        }

        for (const violation of violations) {
            const slNo = worksheet.rowCount;

            worksheet.addRow([
                slNo,
                scenario,
                page.url(),
                violation.type,
                violation.text,
                violation.selector || 'N/A',
                screenshotPath,
                timestamp
            ]);

            const textContent = `
SL NO: ${slNo}
Scenario: ${scenario}
URL: ${page.url()}
Type: ${violation.type}
Actual Text: ${violation.text}
Selector: ${violation.selector || 'N/A'}
Screenshot: ${screenshotPath}
Timestamp: ${timestamp}
----------------------------------------
`;

            fs.appendFileSync(textPath, textContent, 'utf8');
        }

        await workbook.xlsx.writeFile(excelPath);
    });

    console.log('Excel report updated:', excelPath);
    console.log('Text report updated:', textPath);
    console.log('Screenshot captured:', screenshotPath);
}

