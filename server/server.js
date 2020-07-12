const express = require('express');
const app = express();
const puppeteer = require('puppeteer');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); //for public api
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });
  
app.use(express.urlencoded({extended: false}));
app.use(express.json())
app.use(express.static('../client'));

app.post('/getQuestionsAndAnswers', async (req,res) => {
    let productID = req.body.productId;
    const qaProduct = await getQAfromAmazon(productID);
    res.send(qaProduct);
});

app.listen(3000);

async function getQAfromAmazon(productID){
    return puppeteer.launch({ 
        headless: true, 
        slowMo : 250,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080','--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'] })
        .then(async browser => {
        const page = await browser.newPage();
        await page.goto("https://www.amazon.com/ask/questions/asin/" + productID);
        await page.waitForSelector('body');

        var productInfo = await page.evaluate(() => {                    
            let questionsAnsAnswersArray = []; 
            let len = document.querySelectorAll("[id^='question']").length;
            let str;
            let ans;
            for(let i=1;i<len;i++){
                let question = document.querySelectorAll("div.a-fixed-left-grid-col.a-col-right > a > span")[i-1].innerText;
                str = "#a-page > div.a-section.askQuestionListPage > div:nth-child(7) > div > div > div:nth-child("+i+") > div > div.a-fixed-left-grid-col.a-col-right > div.a-fixed-left-grid.a-spacing-base > div > div.a-fixed-left-grid-col.a-col-right > span:nth-child(3)";
                if(document.querySelector(str)==null){
                    ans = "no answer";
                }else{
                    ans = document.querySelector(str).innerText;
                }
                questionsAnsAnswersArray.push("Q " + question);
                questionsAnsAnswersArray.push("A " + ans);
            };
            var product = { 
                "questionsAnsAnswersArray": questionsAnsAnswersArray,
            };
            return product;
            
        });

        await browser.close();
        return productInfo;

    }).catch(function(error) {
        console.error(error);
    });
}