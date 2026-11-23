import {test, expect} from '@playwright/test';
import {DashValidator} from '../utils/dashValidator';
import {recordViolations} from '../utils/reportGenerator';

test.describe('Site wide Dash Validation',()=>{
     const baseURL = process.env.BASE_URL || 'https://recruitpathiq.com';

    test.describe.configure({mode:'Serial'});

    async function validateAndReport(page,scenario){
        const violations=await DashValidator.validatePage(page);
        if(violations.length>0){
            console.log(`Violations found in ${scenario}`);
            console.table(violations);
            await recordViolations(
                page,
                scenario,
                violations
            );
        }

        /*expect.soft(
            violations,
            `Dash violations found in ${scenario}`
        ).toHaveLength(0); */ 

    }

    //static page validation
    const pages=[
        {url:'athletes',scenario:'athletes Page'},
        {url:'how-it-works',scenario:'How it works Page'},
        {url:'parents',scenario:'Parents Page'},
        {url:'pricing',scenario:'Pricing Page'},
        {url:'ncaa-compliance',scenario:'nca compliance Page'},
        {url:'faq',scenario:'FAQ page'},
        {url:'our-story',scenario:'our story page'},
        {url:'resources',scenario:'Resources page'},
        {url:'blog',scenario:'blog page'},
        {url:'contact',scenario:'contact page'},
        {url:'legal',scenario:'Legal page'},
        {url:'resources/dont-admire-the-problem',scenario:'dont-admire-the-problem page'},
        {url:'resources/when-should-you-start',scenario:'when should you start page'},
        {url:'resources/know-the-rules',scenario:'know the rules page'},
        {url:'resources/paths/im-just-starting',scenario:'I am just starting'},
        {url:'resources/paths/get-seen',scenario:'I am get seen'},
        {url:'resources/paths/academics-eligibility',scenario:'Academics Eligibility'},
        {url:'resources/paths/im-a-parent',scenario:'I am a parent'},
        {url:'blog/meet-the-family-behind-recruitpathiq',scenario:'meet the family behind recruitpath'},
    ];

    for (const pageConfig of pages) {
          test(`Static validation: ${pageConfig.scenario}`, async ({ page }) => {

            await page.goto(new URL(pageConfig.url, baseURL).toString());
           // await expect.soft(page.locator('body')).toBeVisible();
            await validateAndReport(page, pageConfig.scenario);
            //await page.pause()

        });
    }

    //dynamic content validation
   /*  test('Signup error validation', async ({ page }) => {

        await page.goto(`${baseURL}/athletes`);

        await page.getByRole('button', {
            name: 'Sign up'
        }).click();

        await expect(
            page.getByText(/required/i).first()
        ).toBeVisible();

        await validateAndReport(page, 'Signup Error Messages');
    });


   test('Dashboard dynamic content validation', async ({ page }) => {

        await page.goto('/dashboard');

        await page.locator('[data-testid="dashboard-content"]')
            .waitFor({ state: 'visible' });

        await validateAndReport(page, 'Dashboard Dynamic Content');
    });


    test('Chilly prompt validation', async ({ page }) => {

        await page.goto('/dashboard');

        await page.getByRole('button', {
            name: 'Generate prompt'
        }).click();

        await expect(
            page.locator('[data-testid="chilly-prompt"]')
        ).toBeVisible();

        await validateAndReport(page, 'Chilly Generated Prompts');
    });*/

});