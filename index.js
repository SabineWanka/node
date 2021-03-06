const inquirer = require('inquirer');
const html = require("./generateHTML.js");
const axios = require('axios');
const fs = require('fs');
const util = require("util");

const path = require("path");


const puppeteer = require("puppeteer")


const writeFileAsync = util.promisify(fs.writeFile);

const colors = {
  green: {
    wrapperBackground: "#E6E1C3",
    headerBackground: "#C1C72C",
    headerColor: "black",
    photoBorderColor: "black"
  },
  blue: {
    wrapperBackground: "#5F64D3",
    headerBackground: "#26175A",
    headerColor: "white",
    photoBorderColor: "#73448C"
  },
  pink: {
    wrapperBackground: "#879CDF",
    headerBackground: "#FF8374",
    headerColor: "white",
    photoBorderColor: "#FEE24C"
  },
  red: {
    wrapperBackground: "#DE9967",
    headerBackground: "#870603",
    headerColor: "white",
    photoBorderColor: "white"
  }
};


function promptUser() {
  return inquirer.prompt([
    {
      type: "input",
      name: "username",
      message: "What is your GitHub username?",
    },

    {
      type: "list",
      name: "color",
      message: "Whats your favourite color?",
      choices: ["red", "blue", "pink", "green"]
    },
  ])
}
async function getUser(username) {
  try {
    const response = await axios.get(`https://api.github.com/users/${username}`);
    return response.data
  } catch (error) {
    console.error(error);
  }
}

function generateHTML(data) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
     <meta charset="UTF-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     <meta http-equiv="X-UA-Compatible" content="ie=edge" />
     <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css"/>
     <link href="https://fonts.googleapis.com/css?family=BioRhyme|Cabin&display=swap" rel="stylesheet">
     <title>Document</title>
     <style>
         @page {
           margin: 0;
         }
        *,
        *::after,
        *::before {
        box-sizing: border-box;
        }
        html, body {
        padding: 0;
        margin: 0;
        }
        html, body, .wrapper {
        height: 100%;
        }
        .wrapper {
        background-color: ${colors[data.color].wrapperBackground};
        padding-top: 100px;
        }
        body {
        background-color: white;
        -webkit-print-color-adjust: exact !important;
        font-family: 'Cabin', sans-serif;
        }
        main {
        background-color: #E9EDEE;
        height: auto;
        padding-top: 30px;
        }
        h1, h2, h3, h4, h5, h6 {
        font-family: 'BioRhyme', serif;
        margin: 0;
        }
        h1 {
        font-size: 3em;
        }
        h2 {
        font-size: 2.5em;
        }
        h3 {
        font-size: 2em;
        }
        h4 {
        font-size: 1.5em;
        }
        h5 {
        font-size: 1.3em;
        }
        h6 {
        font-size: 1.2em;
        }
        .photo-header {
        position: relative;
        margin: 0 auto;
        margin-bottom: -50px;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        background-color: ${colors[data.color].headerBackground};
        color: ${colors[data.color].headerColor};
        padding: 10px;
        width: 95%;
        border-radius: 6px;
        }
        .photo-header img {
        width: 250px;
        height: 250px;
        border-radius: 50%;
        object-fit: cover;
        margin-top: -75px;
        border: 6px solid ${colors[data.color].photoBorderColor};
        box-shadow: rgba(0, 0, 0, 0.3) 4px 1px 20px 4px;
        }
        .photo-header h1, .photo-header h2 {
        width: 100%;
        text-align: center;
        }
        .photo-header h1 {
        margin-top: 10px;
        }
        .links-nav {
        width: 100%;
        text-align: center;
        padding: 20px 0;
        font-size: 1.1em;
        }
        .nav-link {
        display: inline-block;
        margin: 5px 10px;
        }
        .workExp-date {
        font-style: italic;
        font-size: .7em;
        text-align: right;
        margin-top: 10px;
        }
        .container {
        padding: 50px;
        padding-left: 100px;
        padding-right: 100px;
        }

        .row {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          margin-top: 20px;
          margin-bottom: 20px;
        }

        .card {
          padding: 20px;
          border-radius: 6px;
          background-color: ${colors[data.color].headerBackground};
          color: ${colors[data.color].headerColor};
          margin: 20px;
        }
        
        .col {
        flex: 1;
        text-align: center;
        }

        a, a:hover {
        text-decoration: none;
        color: inherit;
        font-weight: bold;
        }

        @media print { 
         body { 
           zoom: .75; 
         } 
        }
</style>
</head>
<body>
  <div class="wrapper">
    <main id="app" class="container">
    <div class="card">
      <div class="photo-header">
        <img width="240" height="240" src="${data.avatar_url}" />
        </div>
        <div class="row">
          <h1>${data.name}</h1>
          <code>${JSON.stringify(data.user)}</code>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
}


async function printPDF(html) {
  try {
    const browser = await puppeteer.launch({
      // these arguments allow puppeteer to work on WSL 2 without going through quite a bit of work to set up a viable sandbox
      // see https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox for more info
      // since we trust the HTML (we create it ourselves!) this should be fine
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({ path: path.join(__dirname, "profile.pdf"), format: "A4" });
    await browser.close();
    console.log("PDF generated!");
  } catch (error) {
    console.log(error);
  }
}

const callback = async function (pdf) {

  // do something with the PDF like send it as the response   
  await writeFileAsync("index.pdf", pdf);
}

async function init() {
  console.log("hi")
  try {
    const answers = await promptUser()
    const data = await getUser(answers.username)

    console.log(data)

    const html = generateHTML({ color: answers.color, ...data });
    printPDF(html);

  } catch (err) {
    console.log(err);
  }


}

init();

