export const GEMINI_VIDEO_DESCRIPTION_PROMPT = `Describe the main action taking place across this entire video, not just a single frame.
Write a detailed factual description of what happens over time.
If multiple events happen, mention them in order.
Do not write a joke or caption.
Do not mention camera or editing details unless they matter to understanding the action.`

const CAPTION_PROMPT_TEMPLATE = `********************
People and locations in this image include No famous or recognizable content was identified in the image.

********************
Here is some additional context for the image, if available:

No additional context available.

********************
Here are ten words or phrases you can use to help make the captions funnier.  You don't have to use them all.  Don't force it.

Words:
Term: mewing
Term Type: Verb
Definition: the facial technique of pressing the tongue to the roof of the mouth to define the jawline, very similar to mogging
Example: im literally looksmaxxing by mewing right now
****

Term: I’m dead
Term Type: Phrase
Definition: Said when something is extremely funny or shocking.
Example: That video was hilarious, I’m dead!
****

Term: sybau
Term Type: Phrase
Definition: A stylized abbreviation or meme version of “shut your b*tch *ss up.” It’s usually said jokingly to friends online, especially after someone says something annoying or cringy
Example: A: “Bro I could totally beat LeBron one-on-one.”
B: “sybau 💀”
****

Term: goat
Term Type: Noun
Definition: Stands for Greatest Of All Time (GOAT). Used to describe someone who is the best in their field. It can also be used as an adjective by calling someone "goated"
Example: Meryl Streep is such a good actress. She's the goat.
****

Term: kksetup
Term Type: null
Definition: A phrase or concept used in generated humor.
Example: When production works on Friday night.
****

Term: it ate
Term Type: Verb
Definition: incredible or slayed
Example: Her outfit ate.
****

Term: Unc Status
Term Type: Noun
Definition: sShort for “uncle status.” Means acting wise, chill, or effortlessly cool — like a respected older figure who’s seen it all. Usually used as a compliment for someone with calm, unbothered energy. can also be used to call someone old
Example: damn you're already 21, you've reached unc status
****

Term: setup
Term Type: null
Definition: A phrase or concept used in generated humor.
Example: When production works on Friday night.
****

Term: setup
Term Type: null
Definition: A phrase or concept used in generated humor.
Example: When production works on Friday night.
****

Term: Type shi
Term Type: Interjection
Definition: A filler phrase used at the end of sentences to make something sound casual, emotional, or “deep.” Similar to “you know what I mean” or “like that.” It’s often used online to add emphasis or vibe.
Example: “I been tryna better myself, type shi.”
or
“Bro was down bad fr, type shi.”
****

********************
Write three short captions for this image.

Keep the joke short and punchy.

Here are the rules for the caption:

- Should avoid long sentences, setups, or explanations
- Should be sharp, mean, and roasty without using slurs or attacking protected traits
- Should not use the "When you feel like X but Y" formula
- Must be under 12 words
- Should anthropomorphize objects or map the subject to a real life situation
- Should sound like a meme page caption: sharp, ironic, and punchy

********************
Example captions:
Image Description: The image shows a close-up of a doll with exaggerated wide-open eyes and a surprised or shocked expression. The doll has light blonde hair styled with a lot of volume, bright orange-red lips, and is wearing small white earrings. The overall look gives a humorous or startled vibe, often used as a meme reaction to express disbelief or sudden realization.
Caption: “We listen & we don’t judge.”
Me:

Explanation: Relate to this face a lot when someone says something completely unhinged
****

Image Description: man talks to the camera seriously
Caption: me having to explain to my mom what a truecell groyper is after she asked why i'm 20 with no girlfriend
Explanation: this is funny as it ties together men having to explain to their moms why they dont have a girlfriend (a common relatable experience) with Gen Z 2025 terms like truecell and groyper (which just means incel and groyper is a fan of Nick Fuentes)
****

Image Description: The image features a glamorous individual with long, flowing hair styled in a light blonde shade, styled in waves. They are dressed in a vibrant green outfit with playful fringe details that seems to shimmer under the stage lights. Their expression is exuberant, with a wide smile and an exaggerated tongue-out pose, exuding confidence and playfulness. The backdrop hints at a lively event atmosphere, with metallic structures and soft lighting enhancing the overall vibe. The individual’s demeanor suggests they’re in a fun, carefree moment, perhaps enjoying the spotlight. Humorously, one could imagine them as a mischievous fairy who just discovered a candy stash, ready to spread joy and giggles. The combination of the outfit’s boldness and the playful pose gives the impression of someone who doesn’t take themselves too seriously, inviting laughter and cheer.
Caption: When your boss says 'let's have a chat' and you're halfway out the door.
Explanation: This is funny because it shows a woman (Cardi B) leaving while her tongue is out, like she is excited for the weekend.  The boss says "let's have a chat", but you're like "latterrrrrrrr".
****

Image Description: The painting depicts a solemn yet dignified old woman, likely a market vendor, standing against a hazy urban backdrop. She wears a vibrant red scarf and a heavy coat, with two large woven baskets cradled in her arms, filled with oranges. Her expression is serious, as if contemplating the mysteries of life or perhaps the price of her fruit. The muted colors of the background contrast sharply with the bold hues of her attire, creating a focal point on her weathered face. Her demeanor suggests resilience and strength, embodying the spirit of hard work. Humorously, one might imagine her having a lively conversation with her oranges, debating which one is the juiciest, or maybe she’s just waiting for a customer who’s taking their sweet time. The overall atmosphere is a mix of nostalgia and warmth, evoking a sense of connection to simpler times.
Caption: When your professor says 'the final is cumulative.'
Explanation: This is funny because it is awful when the final exam is cumulative.  The expression of the woman is sad/troubled, mirroring the feeling a student has when they have to remember the entire semester's worth of material for the final exam.
****

Image Description: This surreal image shows a huge alligator performing a slam dunk with a basketball, set against the backdrop of a massive explosion. Birds and a muscular human figure with a blurred face appear in the foreground, giving the scene a chaotic, exaggerated energy. Text over the image reads, “whoever prayed on my downfall PRAY HARDER,” conveying a defiant and humorous attitude.
Caption: whoever prayed on my downfall PRAY HARDER
Explanation: The image is so random and is very nonsensical
****

Image Description: This image is a humorous meme.
At the top, it has text that reads:
“Jan 1st: new year new me!”
“Jan 3rd:”
Below the text, there’s a photo of a man sitting outdoors at night, holding a large open bag of Doritos and eating from it with both hands. There’s also a can on the ground beside him. The contrast between the optimistic “new year new me” caption and the photo of him eating junk food just two days later makes the meme funny—it jokes about how quickly New Year’s resolutions tend to fall apart.

Caption: Jan 1st: new year new me!, Jan 3rd: eating Doritos and beer
Explanation: The New Year’s resolution was to be a new, healthier version of myself. But it’s only January 3rd, and the guy is already secretly eating Doritos with a beer outside.
****

Image Description: The image shows a man sitting in a bathtub partially filled with water. He is wearing a white dress shirt, a tie, and trousers. He appears to be in distress or deep thought, holding his head with one hand and a beer bottle with the other. The background features white and red tiles, and the lighting in the scene has a mix of green and purple tones, giving it a dramatic or moody atmosphere.
Caption: How it feels at 6 years old learning the sun gonna explode in 5 billion years
Explanation: This is funny because it draws on the canon experience many people have as kids when they find out about the life cycle of a star, which is overreacting and being really upset and scared that the sun is going to explode even though reasonably none of us are going to be around when it happens.
****

Image Description: The image shows a small-sized dog, likely a Chihuahua, with a hilariously messy look. The dog is wearing a long, wild black wig that sticks out in all directions, making it look like it just woke up from a chaotic nap or had a rough morning. It’s also dressed in a light purple outfit and has a slightly smug, sleepy facial expression. The combination of the wild hair and calm, unbothered face gives the image a comically dramatic vibe — like the dog’s having a “bad hair day” but doesn’t care at all.
Caption: Hard work gives you a special kind of glow
My glow:

Explanation: This dog looks like a person who has had enough hard work in their life
****

Image Description: An animated sloth character (from a well-known movie) making a slightly awkward, emotional expression, with text saying this is their reaction when their partner sends them a heartfelt romantic video.
Caption: Me anytime my bf sends me a reels about he feels about me
Explanation: A shocked face
****

Current image description:
{{VIDEO_DESCRIPTION}}

Return exactly three captions.
Put each caption on its own line.
Do not number them.
Do not include any explanation or extra text.`

export function buildGeminiCaptionPrompt(videoDescription) {
  return CAPTION_PROMPT_TEMPLATE.replace('{{VIDEO_DESCRIPTION}}', videoDescription.trim())
}
