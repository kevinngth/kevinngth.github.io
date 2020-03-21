class Portfolio {
    constructor(img_src, title, app_link, repo_link, text) {
        this.img_src = img_src;
        this.title = title;
        this.app_link = app_link;
        this.repo_link = repo_link;
        this.text = text;
    }
}

const PORTFOLIO = [
    new Portfolio('./project-1.png', 'Trading Game', "https://kevinngth.github.io/Project-1-Game/", "https://github.com/kevinngth/Project-1-Game", "A marketplace simulator build on HTML and vanilla JS, using bootstrap as CSS framework."),
    new Portfolio('./project-2.png', 'Jyggr', "https://jyggr.herokuapp.com/", "https://github.com/kevinngth/project-2-App", "Inspiration for the name Jyggr comes from the bartending tool used to measure alcohol, a jigger. It helps users to keep track of their liquor collection and tasting notes. Built on Javascript, using Node.js, Express.js, server-side React, Bootstrap 4 and PostgreSQL."),
    new Portfolio('./project-3.png', 'Nat-Jio', "https://nat-jio.herokuapp.com/", "https://github.com/kevinngth/traveller-guide-app", "A social-travel platform where travelers can look for local guides in their next holiday destination. They can also become guides to meet people and showcase their cities. Built on Ruby on Rails."),
    new Portfolio('./project-4.png', 'Quizter', "http://quizter.herokuapp.com/", "https://github.com/EugeneTan9/Quizter", "A platform for users to quiz one another about any topic. Quiz-makers can also create badges for quiz-takers to try to earn."),
];

export default PORTFOLIO;