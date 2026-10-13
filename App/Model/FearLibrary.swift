import Foundation

/// The built-in content: every fear, its belief, reframe and exposure ladder.
enum FearLibrary {
    static func info(for id: FearID) -> FearInfo {
        all[id]!
    }

    private static func q(_ title: String, _ detail: String) -> QuestTemplate {
        QuestTemplate(title: title, detail: detail)
    }

    static let all: [FearID: FearInfo] = [
        .failure: FearInfo(
            id: .failure, name: "Failure", family: .selfWorth, shade: 0,
            summary: "You'd rather not try than try and fall short.",
            howItKeepsYouStuck: [
                "Waiting until you feel \"ready\" — which never comes",
                "Polishing instead of finishing",
                "Picking goals you already know you can hit",
            ],
            coreBelief: "If I fail, it proves I'm not capable.",
            reframe: "Failing is information, not a verdict. Everyone who got good at anything failed at it first, many times.",
            ladder: [
                q("Name the worst case", "Write the realistic worst outcome of trying and failing. Then write three things you'd do the day after. Notice it's survivable."),
                q("Be a beginner on purpose", "Spend 30 minutes doing something you're bad at — drawing, a language, a sport — without trying to be good."),
                q("Share it unfinished", "Show a rough draft of something to one person and ask what isn't working yet."),
                q("The 48-hour finish", "Pick a small piece of your goal, give yourself 48 hours, and release it at \"good enough\"."),
                q("Try where you might lose", "Go for something with a real chance of a miss — an application, a pitch, a competition — and count the attempt as the win."),
            ]),
        .notEnough: FearInfo(
            id: .notEnough, name: "Not Being Good Enough", family: .selfWorth, shade: 1,
            summary: "A quiet voice says you don't measure up, so you hold back before anyone can confirm it.",
            howItKeepsYouStuck: [
                "Measuring your inside against everyone else's highlight reel",
                "Under-asking, under-charging, under-reaching",
                "Brushing off compliments",
            ],
            coreBelief: "I'm behind, and other people are just better.",
            reframe: "Worth isn't a ranking. You're comparing your chapter 3 to someone else's chapter 20.",
            ladder: [
                q("Evidence file", "List 10 things you've done that took effort or skill. Keep the list somewhere you'll see it."),
                q("Take the compliment", "For one week, answer every compliment with just \"thank you\" — no deflecting."),
                q("Mute the yardstick", "Mute or unfollow three accounts that make you feel behind, for 14 days."),
                q("Ask for more", "Ask for something you'd normally assume you don't deserve: a raise, a higher rate, a bigger role."),
                q("Put your name on it", "Publish or present something with your name clearly attached."),
            ]),
        .foundOut: FearInfo(
            id: .foundOut, name: "Being Found Out", family: .selfWorth, shade: 2,
            summary: "When things go well you feel like a fraud waiting to be exposed, so you avoid going higher.",
            howItKeepsYouStuck: [
                "Over-preparing to hide imagined gaps",
                "Turning down bigger roles or visibility",
                "Crediting luck for everything you've done",
            ],
            coreBelief: "If they look closely, they'll see I don't belong here.",
            reframe: "Feeling like an impostor usually means you're growing into a bigger room, not that you don't belong in it.",
            ladder: [
                q("Write the receipts", "For your last three wins, write what you specifically did that made them work — not luck."),
                q("Say \"I don't know\"", "Say \"I don't know — let me find out\" out loud in a meeting or conversation this week."),
                q("Ask the obvious question", "Ask a question in a group that you worry is too basic."),
                q("Own the win", "Tell someone about something you did well, without a disclaimer."),
                q("Raise your hand", "Volunteer for the bigger, more visible thing you've been telling yourself you're not ready for."),
            ]),
        .rejection: FearInfo(
            id: .rejection, name: "Rejection", family: .social, shade: 0,
            summary: "You protect yourself from \"no\" by never asking.",
            howItKeepsYouStuck: [
                "Never reaching out first",
                "Not applying, pitching or asking someone out",
                "Reading silence as rejection",
            ],
            coreBelief: "If they say no, it means I'm unwanted.",
            reframe: "A \"no\" is usually about timing, fit or circumstance — rarely about your worth. Every no you survive makes the next ask easier.",
            ladder: [
                q("Tiny ask", "Ask a stranger for something small: a recommendation, directions, the time."),
                q("The 10% ask", "Ask for a small discount or an upgrade somewhere. Aim to hear \"no\"."),
                q("Reach out first", "Message someone you'd like to know better and suggest a specific plan."),
                q("Collect three no's", "Make three real requests this week where \"no\" is likely. Score a point for each no."),
                q("The big ask", "Make the ask you've been avoiding — the application, the invitation, the pitch."),
            ]),
        .judgment: FearInfo(
            id: .judgment, name: "Being Judged", family: .social, shade: 1,
            summary: "You edit yourself to avoid what others might think.",
            howItKeepsYouStuck: [
                "Rehearsing and replaying conversations",
                "Hiding your opinions, style or ambitions",
                "Letting an imagined audience make your decisions",
            ],
            coreBelief: "If people see the real me, they'll think less of me.",
            reframe: "People notice you far less than you fear — they're busy worrying about themselves. Psychologists call this the spotlight effect.",
            ladder: [
                q("Spot the audience", "For three days, note each time you change what you do because of what someone might think."),
                q("Small oddity", "Wear something slightly unusual, or do something mildly silly in public, and notice how few people react."),
                q("Say the opinion", "Share an honest opinion in a group where you'd usually stay quiet."),
                q("Post it", "Share something you made or think, publicly, and don't check reactions for 24 hours."),
                q("Do it in front of people", "Do the visible thing you've avoided because of how it would look: a talk, a performance, an announcement."),
            ]),
        .conflict: FearInfo(
            id: .conflict, name: "Conflict", family: .social, shade: 2,
            summary: "Keeping the peace has started to cost you your own needs.",
            howItKeepsYouStuck: [
                "Saying yes when you mean no",
                "Resentment you never say out loud",
                "Letting other people decide for you",
            ],
            coreBelief: "If I disagree, the relationship will break.",
            reframe: "Healthy relationships survive honest disagreement and get stronger for it. Avoiding conflict only postpones it, with interest.",
            ladder: [
                q("Know your no", "List three things you agreed to recently that you didn't want to. Write what you'd have said instead."),
                q("Small no", "Turn down one small request this week, kindly, without over-explaining."),
                q("State a preference", "When someone asks \"where should we eat?\", give a real answer instead of \"I don't mind\"."),
                q("Name the small thing", "Raise one minor issue with someone close: \"I feel… when… could we…?\""),
                q("The real conversation", "Have the conversation you've been avoiding. Prepare your opening line, then say it."),
            ]),
        .unknown: FearInfo(
            id: .unknown, name: "The Unknown", family: .uncertainty, shade: 0,
            summary: "Staying put feels safer than stepping into something you can't predict — even when staying put hurts.",
            howItKeepsYouStuck: [
                "Staying in a job, place or relationship past its expiry date",
                "Needing guarantees before you move",
                "Imagining the worst version of every change",
            ],
            coreBelief: "Unfamiliar means unsafe.",
            reframe: "Standing still isn't risk-free — it's a choice too, with its own costs. You've handled every unknown you've faced so far.",
            ladder: [
                q("Cost of staying", "Write what your life looks like in three years if nothing changes. Be honest."),
                q("New route", "Change one routine this week: a new route, a new café, a new recipe."),
                q("Unplanned afternoon", "Spend half a day with no plan and follow your curiosity."),
                q("Scout the territory", "Talk to someone who already made the change you're considering."),
                q("First real step", "Take one concrete, hard-to-undo step toward the change: sign up, book it, hand in the notice."),
            ]),
        .wrongChoice: FearInfo(
            id: .wrongChoice, name: "Making the Wrong Choice", family: .uncertainty, shade: 1,
            summary: "So afraid of choosing wrong that you don't choose at all.",
            howItKeepsYouStuck: [
                "Endless research and pros-and-cons lists",
                "Asking everyone's opinion but your own",
                "Keeping every option open, and taking none",
            ],
            coreBelief: "There's one right answer, and if I miss it I'll regret it forever.",
            reframe: "Most decisions can be undone, and not deciding is a decision too. You make a choice right by what you do after it.",
            ladder: [
                q("Two-minute decisions", "For one day, make every small decision — food, clothes, what to watch — in under two minutes."),
                q("Which kind of door?", "List the options in your stuck decision and mark each one as reversible or not. Most are reversible."),
                q("Set a deadline", "Give your big decision a date and tell someone what it is."),
                q("Coin flip test", "Flip a coin for your decision. Notice what you hope it lands on — that's information."),
                q("Decide and commit", "Make the call and take the first action within 24 hours. No reopening it for 30 days."),
            ]),
        .losingControl: FearInfo(
            id: .losingControl, name: "Losing Control", family: .uncertainty, shade: 2,
            summary: "If you can't manage the outcome, you'd rather not play.",
            howItKeepsYouStuck: [
                "Over-planning and micromanaging",
                "Avoiding situations you can't steer",
                "Exhaustion from holding everything together",
            ],
            coreBelief: "If I let go, things will fall apart.",
            reframe: "Control is a feeling, not a guarantee. Your strength is how you respond, not whether you prevent every surprise.",
            ladder: [
                q("Two circles", "Draw two circles — what you control and what you don't — and sort your current worries into them."),
                q("Let someone else choose", "Let someone else plan an evening, and don't edit it."),
                q("Hand it off", "Hand off one task and resist checking or redoing it."),
                q("Leave a gap", "Go into something important 80% prepared instead of 100%."),
                q("Into the unsteerable", "Commit to the thing whose outcome you can't control, and focus only on your part."),
            ]),
        .beingLeft: FearInfo(
            id: .beingLeft, name: "Being Left", family: .connection, shade: 0,
            summary: "You brace for people leaving — sometimes by leaving first, or never getting close.",
            howItKeepsYouStuck: [
                "Keeping people at arm's length",
                "Over-giving to make yourself indispensable",
                "Reading a little distance as the end",
            ],
            coreBelief: "If I depend on people, they'll leave and I'll be alone.",
            reframe: "You can't make anyone stay — but you can survive loss, and closeness is worth the risk. You are not too much.",
            ladder: [
                q("Map your people", "Write down who is actually there for you. Notice who has stayed."),
                q("Sit with the gap", "When a reply is slow, wait without double-texting. Afterwards, compare what you imagined with what happened."),
                q("Reach out plainly", "Tell someone you miss them, plainly, with no test or hint."),
                q("Ask, don't guess", "Instead of guessing, ask someone close how they feel about something between you."),
                q("Let someone in", "Commit to a closeness you've kept at arm's length: a deeper friendship, a relationship, a team."),
            ]),
        .beingSeen: FearInfo(
            id: .beingSeen, name: "Being Truly Seen", family: .connection, shade: 1,
            summary: "You keep a polished version of yourself up front so no one sees the struggle.",
            howItKeepsYouStuck: [
                "Saying \"I'm fine\" on autopilot",
                "Never asking for help",
                "Relationships that stay on the surface",
            ],
            coreBelief: "If people see my weak spots, they'll use them or leave.",
            reframe: "Being open is how trust gets built. People feel closer to you when you let them help.",
            ladder: [
                q("Honest check-in", "Next time someone asks how you are, give a true answer instead of \"fine\"."),
                q("Small help", "Ask someone for help with something small you could technically do alone."),
                q("Share a struggle", "Tell one trusted person about something you're finding hard right now."),
                q("Own a mistake", "Admit a mistake openly, without over-explaining or punishing yourself."),
                q("Say the real thing", "Tell someone what they mean to you, or what you actually need from them."),
            ]),
    ]
}
