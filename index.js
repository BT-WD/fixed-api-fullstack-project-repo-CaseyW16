const submitBtn = document.getElementById('continue-btn');


var redactedBoxes = [['fibrous', '', null]];
var boxes = 1;
var boxesWithText = 0;
var score = 0;


function getTextWidth(text, font) {
  // Create a dummy canvas to use its context
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
 
  // Apply the same font style as your target text
  context.font = font;
 
  // Measure and return the width
  const metrics = context.measureText(text);
  return metrics.width;
}




const textContainer = document.getElementById("text-container");
const textBlock = document.getElementById("text-block");


function loadNewParagraph(paragraph) {
    var validSecretWord = false;
    const words = paragraph.split(" ");
    var secretWordIndex;
    var secretWord;

    while (!validSecretWord) {
        secretWordIndex = Math.floor(Math.random() * words.length);
        secretWord = words[secretWordIndex];
        console.log("Secret word: " + secretWord);
        console.log("Is valid: " + isValidWord(secretWord))
        validSecretWord = isValidWord(secretWord);
    }

    var finalHtml = '';
    for (let i = 0; i < words.length; i++) {
        if (i != 0) {
            finalHtml += " ";
        }
        if (i == secretWordIndex) {
            console.log("AH");
            finalHtml += '<span autofocus secretindex="0" spellcheck="false" contenteditable="true" class="redacted"></span>';
        } else {
            finalHtml += words[i]
        }
    }

    console.log("words: " + words);
    console.log("secretWordIndex: " + secretWordIndex);
    redactedBoxes[0] = [secretWord.toString(), '', null];
    textBlock.innerHTML = finalHtml;


    const redactedElements = document.querySelectorAll('.redacted');


    redactedElements.forEach(element => {
        element.addEventListener('input', () => {
            const box = redactedBoxes[element.getAttribute('secretindex')];
            console.log(box);
            box[2] = element;
            box[1] = element.textContent;


            var moreInputRequired = false;
            redactedBoxes.forEach((box) => {
                if (box[1] == '') {
                    moreInputRequired = true;
                    return;
                }
            });
            if (moreInputRequired) {
                submitBtn.disabled = true;
                submitBtn.textContent = "enter a guess";
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = "submit guess";
            }
        });
        element.addEventListener('keydown', function(e) {
            if (e.key === ' ') {
                e.preventDefault();
            }
            if (e.key != 'Backspace' && element.textContent.length > 15) {
                e.preventDefault();
            }
        });
        element.addEventListener('paste', function(e) {
            e.preventDefault();
        })
    });
}




const realAnswerTemplate = document.getElementById('real-answer-template');
const articleLinkTemplate = document.getElementById("article-link-template");
const scoreCounter = document.getElementById("score");
const highscoreCounter = document.getElementById("high-score");


var scaleFactor = 1;


function setScale() {
    // const baselineHeight = 1080;
    // const currentHeight = window.innerHeight;
    // scaleFactor = currentHeight / baselineHeight;
    scaleFactor = .75;
    document.documentElement.style.setProperty('--scale-factor', scaleFactor);
    // console.log(scaleFactor)
}


setScale();


window.addEventListener("resize", () => {
    setScale();


    console.log("resized!")
    const realAnswers = document.querySelectorAll('.real-answer-added');
    realAnswers.forEach((ans) => {
        const correspondingBox = redactedBoxes[ans.getAttribute("secretindex")][2];
        const rect = correspondingBox.getBoundingClientRect();


        const absoluteTop = rect.top + window.scrollY + 30;
        const absoluteLeft = rect.left + window.scrollX;
       
        ans.style.position = 'absolute';
        ans.style.top = absoluteTop + 'px';
        ans.style.left = absoluteLeft + 'px';
    });
})




submitBtn.addEventListener('click', async () => {
    if (submitBtn.textContent == "submit guess") {
        var i = 0;
        redactedBoxes.forEach((box) => {
            submitBtn.hidden = true;
            submitBtn.style.opacity = "0";


            const secretWord = box[0];
            const enteredWord = box[1];
           
            const boxObj = box[2];


            boxObj.setAttribute("contenteditable", false);


            boxObj.style.minWidth = "0px";
           
            const clone = realAnswerTemplate.content.cloneNode(true).firstElementChild;
            clone.textContent = secretWord;


            clone.setAttribute("secretindex", i);
            clone.classList.add("real-answer-added");


            const rect = boxObj.getBoundingClientRect();


            const absoluteTop = rect.top + window.scrollY - 30;
            const absoluteLeft = rect.left + window.scrollX;
           
            clone.style.position = 'absolute';
            clone.style.top = absoluteTop + 'px';
            clone.style.left = absoluteLeft + 'px';


            const realWidth = getTextWidth(secretWord, "30px Special Elite")
            const guessWidth = getTextWidth(enteredWord, "30px Special Elite")


            boxObj.style.width = Math.max(80,guessWidth) + 'px';
            if (guessWidth > realWidth) {
            }
                clone.style.width = boxObj.style.width;


            setTimeout(() => {
                if (guessWidth < realWidth) {
                    boxObj.style.width = realWidth + 'px';
                }
            }, 500);


            setTimeout(() => {
                document.body.appendChild(clone);
                boxObj.classList.add("float");
                if (secretWord == enteredWord) {
                    clone.classList.add("correct");
                    score += 1;
                } else {
                    boxObj.classList.add("incorrect");
                    if (score > localStorage.getItem("highscore")) {
                        highscoreCounter.textContent = score;
                        localStorage.setItem("highscore", score);
                    }
                    score = 0;
                }
            }, 1500);


            setTimeout(() => {
                const articleLink = articleLinkTemplate.content.cloneNode(true).firstElementChild;
                clone.textContent = secretWord;
                document.body.appendChild(articleLink);
                submitBtn.hidden = false;
                submitBtn.style.opacity = "1";
                submitBtn.textContent = secretWord == enteredWord ? "continue" : "try again"
                scoreCounter.textContent = score;
            }, 3000)
            i += 1;
        })
    } else if (submitBtn.textContent == "try again" || submitBtn.textContent == "continue") {
        var a = await getRandomArticle();
        console.log(a.title);
        loadNewParagraph(a.summary)
        submitBtn.textContent = "enter a guess";
        submitBtn.disabled = true;
        document.getElementById("article-link").remove();
        const realAnswers = document.querySelectorAll('.real-answer-added');
        realAnswers.forEach((ans) => {
            ans.remove();
        });
    }


});


window.addEventListener('beforeunload', (event) => {
    //event.preventDefault();
    if (score > localStorage.getItem("highscore")) {
        highscoreCounter.textContent = score;
        localStorage.setItem("highscore", score);
    }
});


if (!localStorage.getItem("highscore")) {
    localStorage.setItem("highscore", 0);
}
highscoreCounter.textContent = localStorage.getItem("highscore");


class Article {
    constructor(title, summary, link) {
        this.title = title;
        this.summary = summary;
        this.link = link;
    }  
}


function isValidWord(word) {
    return (/^[a-z]+$/).test(word);
}

loadNewParagraph("Fill the blank to begin the game");
async function getRandomArticle() {
    var validArticle = false;
    var articleObj;
    const url = "https://en.wikipedia.org/w/api.php?" +
        new URLSearchParams({origin: "*", action: "query", format: "json", generator: "random", grnnamespace: 0, prop: "extracts", exintro: true, explaintext: true, grnlimit: 1});
    while (!validArticle) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            const article = pages[pageId];

            articleObj = new Article(article.title, article.extract, article.link);
            console.log(articleObj.summary)

            if (articleObj.summary.length < 500) {
                validArticle = true;
            }

        } catch (error) {
            console.error("Error fetching article:", error);
        }
    } 
    console.log("length: " + articleObj.summary.length);
    return articleObj;
}


// window.addEventListener('load', (event) => {
//     console.log("test");
//     initGame();
// });


// async function initGame() {
//     var info = await getRandomArticle();
//     loadNewParagraph(info.summary, 4);
// }

