from langchain.prompts.chat import PromptTemplate


questions = [
    "is there any content we could add to the website to improve it?",
    "given what is already on the website, what could be changed visually in order to improve it? Given what is already on the website, how could the text / content be changed in order to improve it?"
]


recommendation_prompt = """This is the XML code representing a webpage, with attributes used to describe various visual features:
</webpage>
{webpage_content}
</webpage>

You are an assistant for a User Experience (UX) designer.

The goal of visitors to this website is: {goal} 

Think in steps: 
- what does this webpage look like right now
- who is the likely user of the website
- what are they trying to achieve

Specifically, answer the following question: {task}

Only output specific design suggestions for this specific webpage, do not re-state the UX Designer's generic goals.

List the improvements. You must structure your answer with JSON. More specifically return a list of JSON objects with fields "title", "description" and "details" (details to guide the implementation).
You must output only the JSON, nothing else, no preamble.
"""


recommendation_prompt_template = PromptTemplate.from_template(recommendation_prompt)