// Quiz content, copied from the Mac app's Swift source (App/Model) by `npm run copy-content`.
// Edit the Swift files, then re-run the script. src/test/parity.test.ts checks the two stay in sync.
import type { Family, FearInfo, LifeArea, Question, Rules, Source } from "./types";

export const families: Family[] = [
  {
    "id": "selfWorth",
    "title": "Self-Worth",
    "hue": 0.76
  },
  {
    "id": "social",
    "title": "Other People",
    "hue": 0.58
  },
  {
    "id": "uncertainty",
    "title": "Uncertainty",
    "hue": 0.05
  },
  {
    "id": "connection",
    "title": "Closeness",
    "hue": 0.4
  }
];

export const fears: FearInfo[] = [
  {
    "id": "failure",
    "name": "Failure",
    "family": "selfWorth",
    "shade": 0,
    "summary": "You'd rather not try than try and fall short.",
    "howItKeepsYouStuck": [
      "Waiting until you feel \"ready\" — which never comes",
      "Polishing instead of finishing",
      "Picking goals you already know you can hit"
    ],
    "coreBelief": "If I fail, it proves I'm not capable.",
    "reframe": "Failing is information, not a verdict. Everyone who got good at anything failed at it first, many times.",
    "ladder": [
      {
        "title": "Name the worst case",
        "detail": "Write the realistic worst outcome of trying and failing. Then write three things you'd do the day after. Notice it's survivable."
      },
      {
        "title": "Be a beginner on purpose",
        "detail": "Spend 30 minutes doing something you're bad at — drawing, a language, a sport — without trying to be good."
      },
      {
        "title": "Share it unfinished",
        "detail": "Show a rough draft of something to one person and ask what isn't working yet."
      },
      {
        "title": "The 48-hour finish",
        "detail": "Pick a small piece of your goal, give yourself 48 hours, and release it at \"good enough\"."
      },
      {
        "title": "Try where you might lose",
        "detail": "Go for something with a real chance of a miss — an application, a pitch, a competition — and count the attempt as the win."
      }
    ]
  },
  {
    "id": "notEnough",
    "name": "Not Being Good Enough",
    "family": "selfWorth",
    "shade": 1,
    "summary": "A quiet voice says you don't measure up, so you hold back before anyone can confirm it.",
    "howItKeepsYouStuck": [
      "Measuring your inside against everyone else's highlight reel",
      "Under-asking, under-charging, under-reaching",
      "Brushing off compliments"
    ],
    "coreBelief": "I'm behind, and other people are just better.",
    "reframe": "Worth isn't a ranking. You're comparing your chapter 3 to someone else's chapter 20.",
    "ladder": [
      {
        "title": "Evidence file",
        "detail": "List 10 things you've done that took effort or skill. Keep the list somewhere you'll see it."
      },
      {
        "title": "Take the compliment",
        "detail": "For one week, answer every compliment with just \"thank you\" — no deflecting."
      },
      {
        "title": "Mute the yardstick",
        "detail": "Mute or unfollow three accounts that make you feel behind, for 14 days."
      },
      {
        "title": "Ask for more",
        "detail": "Ask for something you'd normally assume you don't deserve: a raise, a higher rate, a bigger role."
      },
      {
        "title": "Put your name on it",
        "detail": "Publish or present something with your name clearly attached."
      }
    ]
  },
  {
    "id": "foundOut",
    "name": "Being Found Out",
    "family": "selfWorth",
    "shade": 2,
    "summary": "When things go well you feel like a fraud waiting to be exposed, so you avoid going higher.",
    "howItKeepsYouStuck": [
      "Over-preparing to hide imagined gaps",
      "Turning down bigger roles or visibility",
      "Crediting luck for everything you've done"
    ],
    "coreBelief": "If they look closely, they'll see I don't belong here.",
    "reframe": "Feeling like an impostor usually means you're growing into a bigger room, not that you don't belong in it.",
    "ladder": [
      {
        "title": "Write the receipts",
        "detail": "For your last three wins, write what you specifically did that made them work — not luck."
      },
      {
        "title": "Say \"I don't know\"",
        "detail": "Say \"I don't know — let me find out\" out loud in a meeting or conversation this week."
      },
      {
        "title": "Ask the obvious question",
        "detail": "Ask a question in a group that you worry is too basic."
      },
      {
        "title": "Own the win",
        "detail": "Tell someone about something you did well, without a disclaimer."
      },
      {
        "title": "Raise your hand",
        "detail": "Volunteer for the bigger, more visible thing you've been telling yourself you're not ready for."
      }
    ]
  },
  {
    "id": "rejection",
    "name": "Rejection",
    "family": "social",
    "shade": 0,
    "summary": "You protect yourself from \"no\" by never asking.",
    "howItKeepsYouStuck": [
      "Never reaching out first",
      "Not applying, pitching or asking someone out",
      "Reading silence as rejection"
    ],
    "coreBelief": "If they say no, it means I'm unwanted.",
    "reframe": "A \"no\" is usually about timing, fit or circumstance — rarely about your worth. Every no you survive makes the next ask easier.",
    "ladder": [
      {
        "title": "Tiny ask",
        "detail": "Ask a stranger for something small: a recommendation, directions, the time."
      },
      {
        "title": "The 10% ask",
        "detail": "Ask for a small discount or an upgrade somewhere. Aim to hear \"no\"."
      },
      {
        "title": "Reach out first",
        "detail": "Message someone you'd like to know better and suggest a specific plan."
      },
      {
        "title": "Collect three no's",
        "detail": "Make three real requests this week where \"no\" is likely. Score a point for each no."
      },
      {
        "title": "The big ask",
        "detail": "Make the ask you've been avoiding — the application, the invitation, the pitch."
      }
    ]
  },
  {
    "id": "judgment",
    "name": "Being Judged",
    "family": "social",
    "shade": 1,
    "summary": "You edit yourself to avoid what others might think.",
    "howItKeepsYouStuck": [
      "Rehearsing and replaying conversations",
      "Hiding your opinions, style or ambitions",
      "Letting an imagined audience make your decisions"
    ],
    "coreBelief": "If people see the real me, they'll think less of me.",
    "reframe": "People notice you far less than you fear — they're busy worrying about themselves. Psychologists call this the spotlight effect.",
    "ladder": [
      {
        "title": "Spot the audience",
        "detail": "For three days, note each time you change what you do because of what someone might think."
      },
      {
        "title": "Small oddity",
        "detail": "Wear something slightly unusual, or do something mildly silly in public, and notice how few people react."
      },
      {
        "title": "Say the opinion",
        "detail": "Share an honest opinion in a group where you'd usually stay quiet."
      },
      {
        "title": "Post it",
        "detail": "Share something you made or think, publicly, and don't check reactions for 24 hours."
      },
      {
        "title": "Do it in front of people",
        "detail": "Do the visible thing you've avoided because of how it would look: a talk, a performance, an announcement."
      }
    ]
  },
  {
    "id": "conflict",
    "name": "Conflict",
    "family": "social",
    "shade": 2,
    "summary": "Keeping the peace has started to cost you your own needs.",
    "howItKeepsYouStuck": [
      "Saying yes when you mean no",
      "Resentment you never say out loud",
      "Letting other people decide for you"
    ],
    "coreBelief": "If I disagree, the relationship will break.",
    "reframe": "Healthy relationships survive honest disagreement and get stronger for it. Avoiding conflict only postpones it, with interest.",
    "ladder": [
      {
        "title": "Know your no",
        "detail": "List three things you agreed to recently that you didn't want to. Write what you'd have said instead."
      },
      {
        "title": "Small no",
        "detail": "Turn down one small request this week, kindly, without over-explaining."
      },
      {
        "title": "State a preference",
        "detail": "When someone asks \"where should we eat?\", give a real answer instead of \"I don't mind\"."
      },
      {
        "title": "Name the small thing",
        "detail": "Raise one minor issue with someone close: \"I feel… when… could we…?\""
      },
      {
        "title": "The real conversation",
        "detail": "Have the conversation you've been avoiding. Prepare your opening line, then say it."
      }
    ]
  },
  {
    "id": "unknown",
    "name": "The Unknown",
    "family": "uncertainty",
    "shade": 0,
    "summary": "Staying put feels safer than stepping into something you can't predict — even when staying put hurts.",
    "howItKeepsYouStuck": [
      "Staying in a job, place or relationship past its expiry date",
      "Needing guarantees before you move",
      "Imagining the worst version of every change"
    ],
    "coreBelief": "Unfamiliar means unsafe.",
    "reframe": "Standing still isn't risk-free — it's a choice too, with its own costs. You've handled every unknown you've faced so far.",
    "ladder": [
      {
        "title": "Cost of staying",
        "detail": "Write what your life looks like in three years if nothing changes. Be honest."
      },
      {
        "title": "New route",
        "detail": "Change one routine this week: a new route, a new café, a new recipe."
      },
      {
        "title": "Unplanned afternoon",
        "detail": "Spend half a day with no plan and follow your curiosity."
      },
      {
        "title": "Scout the territory",
        "detail": "Talk to someone who already made the change you're considering."
      },
      {
        "title": "First real step",
        "detail": "Take one concrete, hard-to-undo step toward the change: sign up, book it, hand in the notice."
      }
    ]
  },
  {
    "id": "wrongChoice",
    "name": "Making the Wrong Choice",
    "family": "uncertainty",
    "shade": 1,
    "summary": "So afraid of choosing wrong that you don't choose at all.",
    "howItKeepsYouStuck": [
      "Endless research and pros-and-cons lists",
      "Asking everyone's opinion but your own",
      "Keeping every option open, and taking none"
    ],
    "coreBelief": "There's one right answer, and if I miss it I'll regret it forever.",
    "reframe": "Most decisions can be undone, and not deciding is a decision too. You make a choice right by what you do after it.",
    "ladder": [
      {
        "title": "Two-minute decisions",
        "detail": "For one day, make every small decision — food, clothes, what to watch — in under two minutes."
      },
      {
        "title": "Which kind of door?",
        "detail": "List the options in your stuck decision and mark each one as reversible or not. Most are reversible."
      },
      {
        "title": "Set a deadline",
        "detail": "Give your big decision a date and tell someone what it is."
      },
      {
        "title": "Coin flip test",
        "detail": "Flip a coin for your decision. Notice what you hope it lands on — that's information."
      },
      {
        "title": "Decide and commit",
        "detail": "Make the call and take the first action within 24 hours. No reopening it for 30 days."
      }
    ]
  },
  {
    "id": "losingControl",
    "name": "Losing Control",
    "family": "uncertainty",
    "shade": 2,
    "summary": "If you can't manage the outcome, you'd rather not play.",
    "howItKeepsYouStuck": [
      "Over-planning and micromanaging",
      "Avoiding situations you can't steer",
      "Exhaustion from holding everything together"
    ],
    "coreBelief": "If I let go, things will fall apart.",
    "reframe": "Control is a feeling, not a guarantee. Your strength is how you respond, not whether you prevent every surprise.",
    "ladder": [
      {
        "title": "Two circles",
        "detail": "Draw two circles — what you control and what you don't — and sort your current worries into them."
      },
      {
        "title": "Let someone else choose",
        "detail": "Let someone else plan an evening, and don't edit it."
      },
      {
        "title": "Hand it off",
        "detail": "Hand off one task and resist checking or redoing it."
      },
      {
        "title": "Leave a gap",
        "detail": "Go into something important 80% prepared instead of 100%."
      },
      {
        "title": "Into the unsteerable",
        "detail": "Commit to the thing whose outcome you can't control, and focus only on your part."
      }
    ]
  },
  {
    "id": "beingLeft",
    "name": "Being Left",
    "family": "connection",
    "shade": 0,
    "summary": "You brace for people leaving — sometimes by leaving first, or never getting close.",
    "howItKeepsYouStuck": [
      "Keeping people at arm's length",
      "Over-giving to make yourself indispensable",
      "Reading a little distance as the end"
    ],
    "coreBelief": "If I depend on people, they'll leave and I'll be alone.",
    "reframe": "You can't make anyone stay — but you can survive loss, and closeness is worth the risk. You are not too much.",
    "ladder": [
      {
        "title": "Map your people",
        "detail": "Write down who is actually there for you. Notice who has stayed."
      },
      {
        "title": "Sit with the gap",
        "detail": "When a reply is slow, wait without double-texting. Afterwards, compare what you imagined with what happened."
      },
      {
        "title": "Reach out plainly",
        "detail": "Tell someone you miss them, plainly, with no test or hint."
      },
      {
        "title": "Ask, don't guess",
        "detail": "Instead of guessing, ask someone close how they feel about something between you."
      },
      {
        "title": "Let someone in",
        "detail": "Commit to a closeness you've kept at arm's length: a deeper friendship, a relationship, a team."
      }
    ]
  },
  {
    "id": "beingSeen",
    "name": "Being Truly Seen",
    "family": "connection",
    "shade": 1,
    "summary": "You keep a polished version of yourself up front so no one sees the struggle.",
    "howItKeepsYouStuck": [
      "Saying \"I'm fine\" on autopilot",
      "Never asking for help",
      "Relationships that stay on the surface"
    ],
    "coreBelief": "If people see my weak spots, they'll use them or leave.",
    "reframe": "Being open is how trust gets built. People feel closer to you when you let them help.",
    "ladder": [
      {
        "title": "Honest check-in",
        "detail": "Next time someone asks how you are, give a true answer instead of \"fine\"."
      },
      {
        "title": "Small help",
        "detail": "Ask someone for help with something small you could technically do alone."
      },
      {
        "title": "Share a struggle",
        "detail": "Tell one trusted person about something you're finding hard right now."
      },
      {
        "title": "Own a mistake",
        "detail": "Admit a mistake openly, without over-explaining or punishing yourself."
      },
      {
        "title": "Say the real thing",
        "detail": "Tell someone what they mean to you, or what you actually need from them."
      }
    ]
  }
];

export const sources: Source[] = [
  {
    "id": "criticism",
    "group": "people",
    "shade": 0,
    "title": "Criticism or pressure growing up",
    "howItFormed": "When approval felt conditional on getting it right, your mind learned that falling short was dangerous. The fear is an old protector still on duty.",
    "exercise": {
      "title": "Answer the old critic",
      "detail": "Write down the critical voice's exact words. Whose voice is it really? Then write the reply you'd give a child who heard those words."
    }
  },
  {
    "id": "pastEvent",
    "group": "events",
    "shade": 0,
    "title": "A specific painful experience",
    "howItFormed": "One moment taught your brain \"never again\". It turned a single event into a rule about everything.",
    "exercise": {
      "title": "Rewrite the rule",
      "detail": "Describe the event in five sentences. Write the rule you took from it, then an updated rule that fits who you are now."
    }
  },
  {
    "id": "modelled",
    "group": "people",
    "shade": 1,
    "title": "Watching someone close to me",
    "howItFormed": "You absorbed this fear from someone you watched — a parent, sibling or partner. Part of it may not even be yours.",
    "exercise": {
      "title": "Hand back what isn't yours",
      "detail": "Name who you learned this from. List how your life differs from theirs. Write which parts of the fear you're ready to hand back."
    }
  },
  {
    "id": "instability",
    "group": "events",
    "shade": 1,
    "title": "Instability, loss or unpredictability",
    "howItFormed": "When life around you was unpredictable, staying on guard kept you safe. The alarm still goes off now, even when you're safe.",
    "exercise": {
      "title": "Then vs. now",
      "detail": "Make two columns: \"then\" (what was unstable) and \"now\" (what's steady in your life today). Read the \"now\" column out loud."
    }
  },
  {
    "id": "comparison",
    "group": "people",
    "shade": 2,
    "title": "Comparison and what success is \"supposed\" to look like",
    "howItFormed": "A steady stream of other people's best moments set a bar that nobody actually meets.",
    "exercise": {
      "title": "Your own yardstick",
      "detail": "Write what \"enough\" would actually look like for you — in your own words, not anyone's feed."
    }
  },
  {
    "id": "unsure",
    "group": "unknown",
    "shade": 0,
    "title": "I'm not sure yet",
    "howItFormed": "That's fine — fears often hide where they came from. Curiosity is enough to start.",
    "exercise": {
      "title": "Fear diary",
      "detail": "For a week, jot down each time this fear shows up: what happened, what you felt, what you did. Then look for the pattern."
    }
  }
];

export const lifeAreas: LifeArea[] = [
  {
    "id": "career",
    "title": "Career & work"
  },
  {
    "id": "relationships",
    "title": "Love & relationships"
  },
  {
    "id": "friendships",
    "title": "Friends & social life"
  },
  {
    "id": "health",
    "title": "Health & body"
  },
  {
    "id": "creativity",
    "title": "Creative work"
  },
  {
    "id": "money",
    "title": "Money"
  },
  {
    "id": "purpose",
    "title": "Direction & purpose"
  }
];

export const scale: string[] = [
  "Not me",
  "Rarely",
  "Sometimes",
  "Often",
  "That's me"
];

export const questions: Question[] = [
  {
    "id": "q01",
    "text": "I put off starting things because I might not do them well.",
    "weights": {
      "failure": 1,
      "notEnough": 0.5
    }
  },
  {
    "id": "q02",
    "text": "When I picture trying and falling short, it feels unbearable.",
    "weights": {
      "failure": 1
    }
  },
  {
    "id": "q03",
    "text": "I often feel other people are more capable than me.",
    "weights": {
      "notEnough": 1,
      "foundOut": 0.5
    }
  },
  {
    "id": "q04",
    "text": "When something goes well, I worry people will realise I don't deserve it.",
    "weights": {
      "foundOut": 1
    }
  },
  {
    "id": "q05",
    "text": "I hold back ideas because people might not like them.",
    "weights": {
      "rejection": 0.7,
      "judgment": 0.7
    }
  },
  {
    "id": "q06",
    "text": "I replay conversations, worrying what people thought of me.",
    "weights": {
      "judgment": 1
    }
  },
  {
    "id": "q07",
    "text": "I avoid asking for things because the answer might be no.",
    "weights": {
      "rejection": 1
    }
  },
  {
    "id": "q08",
    "text": "I'd rather go along with something than risk an argument.",
    "weights": {
      "conflict": 1
    }
  },
  {
    "id": "q09",
    "text": "Saying no to someone makes me anxious.",
    "weights": {
      "conflict": 0.7,
      "rejection": 0.5
    }
  },
  {
    "id": "q10",
    "text": "I stay in situations I'm unhappy with because change feels risky.",
    "weights": {
      "unknown": 1
    }
  },
  {
    "id": "q11",
    "text": "I need to know how things will turn out before I commit.",
    "weights": {
      "unknown": 0.7,
      "losingControl": 0.7
    }
  },
  {
    "id": "q12",
    "text": "I research decisions for so long that I never actually decide.",
    "weights": {
      "wrongChoice": 1
    }
  },
  {
    "id": "q13",
    "text": "I'm haunted by the thought of picking the wrong path.",
    "weights": {
      "wrongChoice": 1,
      "unknown": 0.3
    }
  },
  {
    "id": "q14",
    "text": "I feel uneasy when I can't plan or manage how something goes.",
    "weights": {
      "losingControl": 1
    }
  },
  {
    "id": "q15",
    "text": "I find it hard to hand things off to other people.",
    "weights": {
      "losingControl": 1
    }
  },
  {
    "id": "q16",
    "text": "I keep people at arm's length so it hurts less if they leave.",
    "weights": {
      "beingLeft": 1,
      "beingSeen": 0.5
    }
  },
  {
    "id": "q17",
    "text": "I worry that the people I care about will eventually leave.",
    "weights": {
      "beingLeft": 1
    }
  },
  {
    "id": "q18",
    "text": "Letting people see my struggles feels dangerous.",
    "weights": {
      "beingSeen": 1
    }
  },
  {
    "id": "q19",
    "text": "I'd rather seem fine than ask for help.",
    "weights": {
      "beingSeen": 0.8,
      "notEnough": 0.3
    }
  },
  {
    "id": "q20",
    "text": "If I really went for what I want and got it, I'm not sure I could handle it.",
    "weights": {
      "foundOut": 0.6,
      "unknown": 0.3
    }
  },
  {
    "id": "q21",
    "text": "Criticism, even mild, stays with me for days.",
    "weights": {
      "judgment": 0.7,
      "notEnough": 0.5,
      "failure": 0.3
    }
  },
  {
    "id": "q22",
    "text": "I compare my progress to other people's and feel behind.",
    "weights": {
      "notEnough": 1
    }
  }
];

export const rules: Rules = {
  "stepXP": [
    10,
    20,
    40,
    70,
    110
  ],
  "sourceXP": 30,
  "bossXP": 200,
  "maxFocus": 3,
  "ranks": [
    {
      "floor": 0,
      "title": "Frozen"
    },
    {
      "floor": 50,
      "title": "Stirring"
    },
    {
      "floor": 150,
      "title": "Stepping Out"
    },
    {
      "floor": 300,
      "title": "Brave"
    },
    {
      "floor": 600,
      "title": "Bold"
    },
    {
      "floor": 1000,
      "title": "Fear Facer"
    }
  ]
};
