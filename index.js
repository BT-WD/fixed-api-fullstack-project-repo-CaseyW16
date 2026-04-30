var redactedBoxes = [['', '', null]];
var score = 0;
var secretArticleName;
var secretArticleURL;

function getTextWidth(text, font) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
 
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

const textContainer = document.getElementById("text-container");
const textBlock = document.getElementById("text-block");
const submitBtn = document.getElementById('continue-btn');

function typeTextSlowly(textToType, index, skipIndexStart, skipIndexEnd) {
    if (index < textToType.length) {
        if (index == skipIndexStart) {
            textBlock.innerHTML += textToType.substring(skipIndexStart, skipIndexEnd);
            index = skipIndexEnd;
        } else {
            textBlock.innerHTML += textToType.charAt(index);
        }
        setTimeout(function () {
            typeTextSlowly(textToType, index + 1, skipIndexStart, skipIndexEnd);
        }, 10);
    } else {
        finishTyping();
    }
}

async function loadNewParagraph(article) {
    paragraph = article.summary
    secretArticleName = article.title;
    secretArticleURL = article.link;

    var validSecretWord = false;
    const words = paragraph.split(" ");
    var secretWordIndex;
    var secretWord;

    var attempts = 0;
    while (!validSecretWord && attempts < 5) {
        secretWordIndex = Math.floor(Math.random() * words.length);
        secretWord = words[secretWordIndex];
        var valid = await isValidWord(secretWord);
        validSecretWord = valid;
        attempts++;
    }
    if (!validSecretWord) {
        var article = await getRandomArticle();
        loadNewParagraph(article);
        return;
    }

    var finalHtml = '';
    for (let i = 0; i < words.length; i++) {
        if (i != 0) {
            finalHtml += " ";
        }
        if (i == secretWordIndex) {
            finalHtml += '<span autofocus secretindex="0" spellcheck="false" contenteditable="true" class="redacted"></span>';
        } else {
            finalHtml += words[i]
        }
    }

    redactedBoxes[0] = [secretWord.toString(), '', null];
    const skipStart = finalHtml.indexOf("<span");
    const skipEnd = finalHtml.indexOf("</span>") + 6;
    textBlock.innerHTML = '';
    typeTextSlowly(finalHtml, 0, skipStart, skipEnd)
}

function finishTyping() {
    const redactedElements = document.querySelectorAll('.redacted');
    redactedElements.forEach(element => {
        element.addEventListener('input', () => {
            const box = redactedBoxes[element.getAttribute('secretindex')];
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

function setScale() {
    var scaleFactor = .6;
    document.documentElement.style.setProperty('--scale-factor', scaleFactor);
}

setScale();

function setRealAnswerPositions() {
    const realAnswers = document.querySelectorAll('.real-answer-added');
    realAnswers.forEach((ans) => {
        const correspondingBox = redactedBoxes[ans.getAttribute("secretindex")][2];
        const rect = correspondingBox.getBoundingClientRect();

        const absoluteTop = rect.top + window.scrollY + 17;
        const absoluteLeft = rect.left + window.scrollX;
       
        ans.style.position = 'absolute';
        ans.style.top = absoluteTop + 'px';
        ans.style.left = absoluteLeft + 'px';
    });
}

window.addEventListener("resize", () => {
    setScale();
    setRealAnswerPositions();
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
                articleLink.innerHTML = `from '<a href="${secretArticleURL}">${secretArticleName}</a>'`
                clone.textContent = secretWord;
                document.body.appendChild(articleLink);
                submitBtn.hidden = false;
                submitBtn.style.opacity = "1";
                submitBtn.textContent = secretWord == enteredWord ? "continue" : "try again"
                scoreCounter.textContent = score;
                setRealAnswerPositions();
            }, 3000)

            i += 1;
        })
    } else if (submitBtn.textContent == "try again" || submitBtn.textContent == "continue") {
        var a = await getRandomArticle();
        loadNewParagraph(a)

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


async function isValidWord(word) {
    if ((/^[a-z]+$/).test(word) && word.length >= 4) {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        return response.ok;
    }
    return false;
}

async function getRandomArticle() {
    var validArticle = false;
    var articleObj;
    const url = "https://en.wikipedia.org/w/api.php?" +
        new URLSearchParams({origin: "*", action: "query", format: "json", generator: "random", grnnamespace: 0, prop: "extracts", exintro: true, explaintext: true, grnlimit: 1});
    var attempts = 0;
    while (!validArticle && attempts < 15) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            const article = pages[pageId];

            articleObj = new Article(article.title, article.extract, `https://en.wikipedia.org/wiki/${article.title}`);

            if (articleObj.summary.length < 700 && articleObj.summary.length > 200 && !articleObj.title.includes("List of") && !articleObj.summary.includes("refer to:")) {
                validArticle = true;
            }

        } catch (error) {
            console.error("Error fetching article:", error);
        }
        attempts++;
    } 
    return articleObj;
}

window.addEventListener('load', (event) => {
    initGame();
});

async function initGame() {
    var article = await getRandomArticle();
    loadNewParagraph(article);
}

