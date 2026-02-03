# Subtaste Validation Tests

## Purpose
Validate whether the Subtaste archetype taxonomy can predict content performance and audience resonance. These tests turn the Subtaste system from an interesting framework into a defensible, data-backed asset.

---

## Test 1: A/B Content Performance by Designation

**Hypothesis:** Content generated from different Subtaste designations produces measurably different engagement patterns on the same topic.

**Method:**
1. Pick 5 neutral topics (e.g. "morning routine", "productivity", "travel", "food", "fitness")
2. For each topic, generate 12 posts — one per Subtaste designation — using the same platform (Instagram caption)
3. Publish all 12 variants across a test account over 2 weeks (randomise posting times)
4. Track per-post: likes, saves, shares, comments, link clicks, profile visits

**Success criteria:**
- Statistically significant variance in engagement across designations (ANOVA p < 0.05)
- At least 2 designations consistently outperform the mean by >20%
- Save rate (intent signal) clusters around specific designations

**Data collection:**
```
| Post ID | Topic | Subtaste Code | Likes | Saves | Shares | Comments | Link Clicks |
|---------|-------|---------------|-------|-------|--------|----------|-------------|
```

---

## Test 2: Audience Archetype Clustering

**Hypothesis:** An audience can be profiled into Subtaste designations, and they engage more with content that matches their designation.

**Method:**
1. Build a lightweight quiz (5-7 questions) that maps respondents to a Subtaste code — use the existing Taste Genome quiz infrastructure
2. Distribute to an existing audience (min 200 respondents)
3. Track which content each respondent engages with most over 30 days
4. Cross-reference: does a respondent's Subtaste code predict which content voice they engage with?

**Success criteria:**
- Respondents engage 30%+ more with content matching their own designation
- Designation clusters are non-uniform (audience isn't evenly distributed — some codes dominate)
- At least 3 distinct audience segments emerge

**Data collection:**
```
| User ID | Quiz Result (Code) | Top Engaged Posts (Codes) | Match Rate |
|---------|--------------------|---------------------------|------------|
```

---

## Test 3: Retrospective Creator Analysis

**Hypothesis:** Successful creators naturally operate within a consistent Subtaste designation, and breaks in consistency correlate with engagement drops.

**Method:**
1. Select 10 creators across niches (fitness, fashion, tech, food, lifestyle)
2. Classify their last 50 posts by Subtaste designation (manual or AI-assisted)
3. Calculate voice consistency score (% of posts matching dominant designation)
4. Correlate consistency score with average engagement rate

**Success criteria:**
- Creators with >70% voice consistency have higher avg engagement than those below 50%
- Engagement dips correlate with designation switches (within-creator analysis)
- Dominant designation varies by niche (not everyone is the same code)

**Data collection:**
```
| Creator | Niche | Dominant Code | Consistency % | Avg Engagement Rate | Correlation |
|---------|-------|---------------|---------------|---------------------|-------------|
```

---

## Test 4: Stan Conversion by Archetype

**Hypothesis:** Certain Subtaste designations drive deeper audience conversion (follower to buyer/subscriber) than others, independent of total reach.

**Method:**
1. Generate landing page copy / CTA content in each of the 12 designations
2. Run as split tests on a product or service (even a free lead magnet)
3. Track full funnel: impression > click > signup > purchase/action
4. Compare conversion rate per designation

**Success criteria:**
- Conversion rate varies >2x between highest and lowest performing designation
- High-conversion designations are NOT the same as high-engagement designations (proving vanity metrics != value)
- Specific designations cluster around specific funnel stages (some are better at awareness, others at conversion)

**Data collection:**
```
| Variant | Subtaste Code | Impressions | Clicks | Signups | Conversions | Conv Rate |
|---------|---------------|-------------|--------|---------|-------------|-----------|
```

---

## Test 5: Cross-Platform Voice Transfer

**Hypothesis:** A Subtaste designation produces a recognisably consistent voice across platforms (Instagram, TikTok, LinkedIn, email) even though format differs.

**Method:**
1. Pick 3 Subtaste designations
2. Generate content for the same topic across 4 platforms using each designation
3. Present the 12 pieces of content to 20 evaluators (blind, no labels)
4. Ask evaluators to group content by "same voice" — can they cluster correctly?

**Success criteria:**
- Evaluators correctly group >60% of content by designation (above chance: 25%)
- Cross-platform consistency is rated higher than within-platform random groupings
- Evaluators can articulate why they grouped them (validates the taxonomy is perceptible)

**Data collection:**
```
| Evaluator | Correct Groupings (out of 12) | Accuracy % | Confidence Rating |
|-----------|-------------------------------|------------|-------------------|
```

---

## Execution Priority

1. **Test 1** — cheapest, fastest, proves basic variance. Do this first.
2. **Test 3** — uses existing public data, no audience needed. Do second.
3. **Test 4** — highest commercial value if proven. Do third.
4. **Test 2** — requires audience and quiz. Do when audience is available.
5. **Test 5** — academic validation. Do when seeking partnerships.

## Tools Needed
- Slayt GeneratorPanel (content generation per designation)
- Social media test account(s) with consistent follower base
- Spreadsheet or lightweight database for tracking
- Optional: sentiment analysis API for qualitative scoring
