# What Do You Actually Fear

<img src="docs/images/icon.png" width="72" align="right" alt="App icon">

A Mac app and website that finds the fears keeping you stuck, works out where they came from, and turns facing them into a quest plan you play through, one small brave step at a time.

**[Try it in your browser →](https://amalmehta.github.io/WhatDoYouActuallyFear/)** · [see a demo with sample answers](https://amalmehta.github.io/WhatDoYouActuallyFear/?demo)

![Results: your top fears, the belief underneath each, and where it likely started](docs/images/results-light.png)

| Answer 22 quick statements | Then work through your quests |
|---|---|
| ![A questionnaire statement with a five-point scale](docs/images/question-light.png) | ![Quest board with rank, XP and a fear-vs-reality score](docs/images/quest-board-dark.png) |

```mermaid
flowchart LR
    A[Where you're stuck<br/>+ your goal] --> B[22 statements]
    B --> C[Top 3 fears]
    C --> D[Where each started]
    D --> E[Quest plan:<br/>root work + 5 steps per fear]
    E --> F[Final boss:<br/>your goal]
```

![The website's quest board](docs/images/website.png)

**Links**

- [Website](https://amalmehta.github.io/WhatDoYouActuallyFear/)
- [How to set up, run and use it](docs/INSTRUCTIONS.md)
- [System design](docs/SYSTEM-DESIGN.md)
- [What's where in the code](docs/FILE-STRUCTURE.md)
